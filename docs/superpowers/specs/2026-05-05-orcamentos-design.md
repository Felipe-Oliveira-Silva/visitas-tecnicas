# Design: Módulo de Orçamentos — Relatec

**Data:** 2026-05-05  
**Status:** Aprovado pelo usuário  
**Escopo:** MVP — sem ERP, sem financeiro, sem aprovação online, sem envio por email

---

## Contexto

O Relatec é um SaaS multiempresa para gestão de visitas técnicas. Este documento especifica o módulo de Orçamentos (MVP), a ser adicionado sem alterar fluxos existentes de visitas, relatórios, billing ou autenticação.

---

## Decisões arquiteturais

| Decisão | Escolha | Motivo |
|---|---|---|
| Itens do orçamento | Tabela separada `QuotationItem` | Relacional, queryável, consistente com o projeto |
| PDF | Gerado com react-pdf/renderer, salvo no R2 | Idêntico ao padrão de `ReportPdf` |
| Valores monetários | `Decimal @db.Decimal(10,2)` | Evita erros de ponto flutuante |
| Mutations | API Routes (não Server Actions) | Segue padrão do projeto |
| `visitId` | Opcional — suporta orçamento independente e vinculado a visita | Dois fluxos de uso |

---

## 1. Models Prisma

```prisma
enum QuotationStatus {
  DRAFT
  SENT
  APPROVED
  REJECTED
}

model Quotation {
  id          String          @id @default(cuid())
  title       String
  description String?
  notes       String?
  validUntil  DateTime
  discount    Decimal         @default(0) @db.Decimal(10, 2)  // valor fixo em R$, não percentual
  subtotal    Decimal         @default(0) @db.Decimal(10, 2)
  total       Decimal         @default(0) @db.Decimal(10, 2)
  status      QuotationStatus @default(DRAFT)
  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt

  companyId   String
  clientId    String
  visitId     String?
  createdById String

  company     Company         @relation(fields: [companyId],   references: [id])
  client      Client          @relation(fields: [clientId],    references: [id])
  visit       Visit?          @relation(fields: [visitId],     references: [id])
  createdBy   User            @relation("QuotationsCreated", fields: [createdById], references: [id])
  items       QuotationItem[]
  pdf         QuotationPdf?

  @@index([companyId])
  @@index([clientId])
  @@index([visitId])
}

model QuotationItem {
  id          String    @id @default(cuid())
  description String
  quantity    Decimal   @db.Decimal(10, 3)
  unitPrice   Decimal   @db.Decimal(10, 2)
  total       Decimal   @db.Decimal(10, 2)
  order       Int       @default(0)

  quotationId String
  quotation   Quotation @relation(fields: [quotationId], references: [id], onDelete: Cascade)

  @@index([quotationId])
}

model QuotationPdf {
  id          String    @id @default(cuid())
  pdfPath     String
  createdAt   DateTime  @default(now())

  quotationId String    @unique
  companyId   String

  quotation   Quotation @relation(fields: [quotationId], references: [id])
}
```

### Back-relations nos models existentes (sem nova coluna SQL)

```prisma
// Company — adicionar:
quotations    Quotation[]

// Client — adicionar:
quotations    Quotation[]

// Visit — adicionar:
quotations    Quotation[]

// User — adicionar:
quotationsCreated Quotation[] @relation("QuotationsCreated")
```

---

## 2. Migration

**Uma única migration aditiva. Nenhuma tabela existente é modificada.**

```
npx prisma migrate dev --name add-quotation-module
npx prisma generate
```

Tabelas criadas: `Quotation`, `QuotationItem`, `QuotationPdf`  
Enum criado: `QuotationStatus`  
Risco: **zero** — 100% aditivo.

Ordem de deploy: rodar a migration **antes** de subir o código novo.

---

## 3. Páginas

```
src/app/dashboard/(protected)/orcamentos/
├── page.tsx              # Listagem — async Server Component
├── novo/
│   └── page.tsx          # Cria form wrapper (carrega clients server-side)
└── [id]/
    ├── page.tsx          # Detalhe — async Server Component
    └── editar/
        └── page.tsx      # Edit wrapper (guard: redirect se status !== DRAFT)
```

**Alteração em página existente:**
- `visitas/[id]/page.tsx` — adiciona botão "Gerar Orçamento" (visível para ADMIN e TECHNICIAN; oculto para READER)
- `sidebar.tsx` — adiciona item "Orçamentos" com `adminOnly: false` (visível a todos os roles, pois READER pode visualizar)

---

## 4. API Routes

```
src/app/api/orcamentos/
├── route.ts                    # GET (lista), POST (cria)
└── [id]/
    ├── route.ts                # GET (detalhe), PUT (edita, só DRAFT)
    ├── status/
    │   └── route.ts            # PATCH (transição de status)
    └── gerar-pdf/
        └── route.ts            # POST (gera PDF, upload R2, upsert QuotationPdf)
```

### Lógica de cada rota

**GET /api/orcamentos**
- `WHERE companyId = session.user.companyId`
- Suporta `?status=` e `?search=` como query params

**POST /api/orcamentos**
- Role ≠ READER
- Valida `client.companyId === session.user.companyId`
- Se `visitId`: valida `visit.companyId === session.user.companyId`
- Server recomputa todos os totais (nunca confia no client)
- Cria Quotation + QuotationItem[] em transaction

**GET /api/orcamentos/[id]**
- `findUnique({ where: { id, companyId } })` — 404 se não pertencer à empresa

**PUT /api/orcamentos/[id]**
- Role ≠ READER
- Verifica `quotation.companyId === session.user.companyId`
- Verifica `quotation.status === 'DRAFT'`
- TECHNICIAN: só se `quotation.createdById === session.user.id`
- Deleta e recria itens em transaction; recomputa totais

**PATCH /api/orcamentos/[id]/status**
- Máquina de estados:
  - `DRAFT → SENT`: ADMIN ou TECHNICIAN criador
  - `SENT → APPROVED`: apenas ADMIN
  - `SENT → REJECTED`: apenas ADMIN
  - Qualquer outra transição → 400

**POST /api/orcamentos/[id]/gerar-pdf**
- Role ≠ READER
- Verifica companyId
- `renderToBuffer(OrcamentoPdf, { quotation, generatedAt })`
- Upload R2: `{companyId}/quotations/{id}/quotation.pdf`
- Upsert QuotationPdf
- Retorna presigned URL

---

## 5. Componentes

```
src/components/
└── orcamento-pdf.tsx                    # Template PDF (react-pdf/renderer)

src/app/dashboard/(protected)/orcamentos/
├── quotation-form.tsx                   # 'use client' — form create/edit
├── quotation-items-editor.tsx           # 'use client' — linhas dinâmicas
├── quotation-card.tsx                   # Server Component — card da lista
├── change-status-button.tsx             # 'use client' — transição de status
└── generate-pdf-button.tsx              # 'use client' — gerar PDF

src/app/dashboard/(protected)/visitas/[id]/
└── generate-quotation-button.tsx        # 'use client' — botão na visita
```

### Layout do PDF

```
┌─────────────────────────────────────────┐
│ [Logo]              ORÇAMENTO #id       │
│ Nome da empresa                         │
├─────────────────────────────────────────┤
│ Cliente: Nome | CNPJ | Cidade           │
│ Validade: DD/MM/YYYY                    │
│ Ref. Visita: #id (se existir)           │
├─────────────────────────────────────────┤
│ Descrição        │ Qtd │ Unit │  Total  │
│ ─────────────────┼─────┼──────┼──────── │
│ Item 1           │  2  │  R$X │  R$Y   │
├─────────────────────────────────────────┤
│                  Subtotal: R$X          │
│                  Desconto: R$X          │
│                     TOTAL: R$X          │
├─────────────────────────────────────────┤
│ Observações: ...                        │
│ Gerado em: DD/MM/YYYY — Relatec         │
└─────────────────────────────────────────┘
```

---

## 6. Fluxo do usuário

### Fluxo A — Orçamento independente

```
Sidebar "Orçamentos"
  → /dashboard/orcamentos               (lista + filtro status)
  → "Novo Orçamento"
  → /dashboard/orcamentos/novo          (selecionar cliente, título, validade, itens, desconto, notas)
  → POST /api/orcamentos
  → redirect /dashboard/orcamentos/[id] (status: DRAFT)
     ├── [DRAFT]    "Editar"             → /editar
     ├── [DRAFT]    "Marcar como Enviado" → PATCH /status → SENT
     ├── [DRAFT]    "Gerar PDF"           → POST /gerar-pdf → download
     ├── [SENT]     "Marcar como Aprovado" → PATCH /status → APPROVED
     ├── [SENT]     "Marcar como Rejeitado" → PATCH /status → REJECTED
     └── [APPROVED|REJECTED] → somente leitura
```

### Fluxo B — A partir de uma visita

```
/dashboard/visitas/[id]
  → "Gerar Orçamento" (ADMIN ou TECHNICIAN)
  → /dashboard/orcamentos/novo?visitId=[id]&clientId=[clientId]
  → Form pré-preenchido; cliente e visitId readonly
  → Mesmo fluxo A a partir do POST
```

### Máquina de estados

```
DRAFT → SENT → APPROVED
              → REJECTED
(sem retrocesso)
```

---

## 7. Permissões

| Ação | ADMIN | TECHNICIAN | READER | SUPERADMIN |
|---|---|---|---|---|
| Listar orçamentos da empresa | ✅ todos | ✅ todos | ✅ todos | ✅ todos |
| Ver detalhe | ✅ | ✅ | ✅ | ✅ |
| Criar | ✅ | ✅ | ❌ | ✅ |
| Editar (só DRAFT) | ✅ qualquer | ✅ só os próprios | ❌ | ✅ |
| DRAFT → SENT | ✅ | ✅ só os próprios | ❌ | ✅ |
| SENT → APPROVED/REJECTED | ✅ | ❌ | ❌ | ✅ |
| Gerar PDF | ✅ | ✅ | ❌ | ✅ |
| Deletar | Fora do MVP | — | — | — |

---

## 8. Multi-tenant por companyId

| Ponto | Garantia |
|---|---|
| Listagem | `WHERE companyId = session.user.companyId` |
| Detalhe/Edit | `findUnique({ where: { id, companyId } })` — 404 se falhar |
| Criação | `companyId` sempre de `session.user.companyId`, nunca do body |
| clientId | Valida `client.companyId === session.user.companyId` |
| visitId | Valida `visit.companyId === session.user.companyId` se fornecido |
| R2 path | `{companyId}/quotations/{id}/...` |
| searchParams | Server valida IDs antes de pré-preencher o form |

---

## 9. Validações Zod

```typescript
const quotationItemSchema = z.object({
  description: z.string().min(1).max(500),
  quantity:    z.number().positive(),
  unitPrice:   z.number().min(0),
  order:       z.number().int().default(0),
  // total: não aceito do client — server recomputa sempre
})

const createQuotationSchema = z.object({
  title:       z.string().min(2).max(255),
  description: z.string().max(2000).optional(),
  notes:       z.string().max(2000).optional(),
  validUntil:  z.string().datetime(),
  discount:    z.number().min(0).default(0),  // valor fixo em R$ (não percentual)
  clientId:    z.string().cuid(),
  visitId:     z.string().cuid().optional(),
  items:       z.array(quotationItemSchema).min(1),
})

const statusTransitionSchema = z.object({
  status: z.enum(['SENT', 'APPROVED', 'REJECTED']),
})
```

**Cálculo server-side (invariante):**
```typescript
const computedItems = items.map(item => ({
  ...item,
  total: new Decimal(item.quantity).mul(item.unitPrice).toDecimalPlaces(2),
}))
const subtotal = computedItems.reduce((acc, i) => acc.plus(i.total), new Decimal(0))
const total    = subtotal.minus(discount).toDecimalPlaces(2)
```

**Serialização Decimal no JSON response:**
Todos os campos `Decimal` devem ser serializados explicitamente (`.toNumber()` ou `.toString()`), pois `JSON.stringify` não serializa `Decimal` nativamente.

---

## 10. Riscos técnicos

| Risco | Prob | Impacto | Mitigação |
|---|---|---|---|
| Cross-tenant via clientId/visitId | Baixa | Alto | Validar ownership em toda criação/edição |
| Total incorreto (confiado do client) | Média | Médio | Sempre recomputar server-side |
| Decimal não serializado no JSON | Alta | Médio | Serializar explicitamente todos os campos |
| Migration falhar em prod | Muito baixa | Alto | Migration aditiva; testar em staging |
| TECHNICIAN editando orçamento alheio | Baixa | Médio | Checar `createdById === session.user.id` no PUT |
| PDF com layout quebrado | Média | Baixo | Testar output localmente antes de subir |
| Naming conflict de relation no User | Baixa | Alto | `@relation("QuotationsCreated")` nos dois lados |

---

## 11. Plano de implementação

### Etapa 1 — Schema + Migration (~1-2h) — risco zero
- Adicionar enum e models ao `schema.prisma`
- Adicionar back-relations
- `prisma migrate dev --name add-quotation-module`
- `prisma generate`
- **Deploy da migration antes de qualquer código novo**

### Etapa 2 — API Routes (~3-4h) — sem UI
- `GET/POST /api/orcamentos`
- `GET/PUT /api/orcamentos/[id]`
- `PATCH /api/orcamentos/[id]/status`
- Zod, cálculo server-side, isolamento cross-tenant, roles
- Testável via Postman

### Etapa 3 — Listagem + Detalhe (~2-3h) — somente leitura
- `orcamentos/page.tsx`
- `orcamentos/[id]/page.tsx`
- `quotation-card.tsx`, `change-status-button.tsx`
- Adicionar "Orçamentos" ao `sidebar.tsx` (uma linha)

### Etapa 4 — Formulário Criar/Editar (~4-5h) — mais complexo
- `orcamentos/novo/page.tsx`
- `orcamentos/[id]/editar/page.tsx` (guard DRAFT)
- `quotation-form.tsx` + `quotation-items-editor.tsx`
- Cálculo em tempo real no client + recompute no server

### Etapa 5 — PDF (~2-3h)
- `orcamento-pdf.tsx`
- `POST /api/orcamentos/[id]/gerar-pdf`
- `generate-pdf-button.tsx`
- Teste visual do output

### Etapa 6 — Integração com Visita (~1h) — mínimo risco
- `generate-quotation-button.tsx` em `visitas/[id]/page.tsx`
- `novo/page.tsx` lê `?visitId=` e `?clientId=` dos searchParams

---

## 12. Estimativa de complexidade

| Etapa | Complexidade | Risco |
|---|---|---|
| 1 — Schema/Migration | Baixa | Mínimo |
| 2 — API Routes | Média | Baixo |
| 3 — Listagem/Detalhe | Baixa | Mínimo |
| 4 — Formulário | Alta | Médio |
| 5 — PDF | Média | Baixo |
| 6 — Integração Visita | Baixa | Mínimo |
| **Total** | **Média** | **Baixo** |

**Estimativa total: 13–18h de implementação cuidadosa**

**Impacto em código existente:**
- `sidebar.tsx` — 1 linha (novo nav item)
- `visitas/[id]/page.tsx` — 1 botão condicional
- `schema.prisma` — back-relations (sem SQL nas tabelas existentes)
- Tudo o mais é código novo em arquivos novos

---

## Fora do escopo deste MVP

- Pagamento / financeiro
- Impostos avançados
- Aprovação online pelo cliente
- Assinatura do orçamento
- Envio por e-mail
- Catálogo de produtos
- Estoque
- Recorrência
- Conversão automática em visita
- Integração Mercado Pago
- Limites de plano para orçamentos
