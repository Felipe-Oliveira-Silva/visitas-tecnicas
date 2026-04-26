# Mercado Pago Billing — Design Spec
**Data:** 2026-04-26
**Status:** Aprovado

---

## Objetivo

Substituir o fluxo de assinatura via WhatsApp por billing recorrente real usando Mercado Pago Preapproval (subscriptions). ADMIN escolhe um plano em `/dashboard/plano`, é redirecionado para o checkout do MP, e o plano da empresa é ativado somente após confirmação via webhook.

---

## Premissas

- `Company.plan = null` → sem assinatura ativa → bloqueio total do dashboard (exceto `/dashboard/plano`)
- `Company.plan = 'start' | 'pro' | 'enterprise'` → plano ativo, liberado
- SUPERADMIN pode setar `Company.plan` manualmente como bypass (sem passar por billing)
- Plano só muda via webhook — nunca pelo clique do botão
- Webhook idempotente: reenvios do MP não causam efeito colateral

---

## Infraestrutura

```
ADMIN clica "Assinar"
    │
    ▼
POST /api/subscriptions
    ├─ cria preapproval inline no MP
    ├─ salva Subscription (PENDING) no banco
    └─ retorna { checkoutUrl }

Frontend redireciona → Mercado Pago checkout

Usuário paga → MP redireciona para back_url (/dashboard/plano)

MP dispara webhook → POST /api/webhooks/mercadopago
    ├─ valida assinatura x-signature
    ├─ busca GET /preapproval/{id} no MP (fonte canônica)
    ├─ atualiza Subscription.status
    └─ atualiza Company.plan (somente se authorized)
```

**Env vars (Production no Vercel):**

| Variável | Descrição |
|---|---|
| `MP_ACCESS_TOKEN` | Token de acesso MP (`APP_USR-...` produção, `TEST-...` sandbox) |
| `MP_WEBHOOK_SECRET` | Secret para validação HMAC-SHA256 do webhook |
| `NEXT_PUBLIC_APP_URL` | URL base do app (ex: `https://visitas-tecnicas.vercel.app`) |

---

## Mudanças de código

### 1. `src/lib/billing.ts` — helper central (novo)

Fonte única de verdade para preços, nomes, limites e config do MP. Todos os outros módulos importam daqui.

```ts
export const BILLING_PLANS = {
  start: {
    key: 'start' as const,
    name: 'Básico',
    description: 'Relatec – Plano Básico',
    price: 49,
    currencyId: 'BRL',
    frequency: 1,
    frequencyType: 'months' as const,
    visitsPerMonth: 30,
    users: 2,
  },
  pro: {
    key: 'pro' as const,
    name: 'Profissional',
    description: 'Relatec – Plano Profissional',
    price: 109,
    currencyId: 'BRL',
    frequency: 1,
    frequencyType: 'months' as const,
    visitsPerMonth: 300,
    users: 10,
  },
  enterprise: {
    key: 'enterprise' as const,
    name: 'Premium',
    description: 'Relatec – Plano Premium',
    price: 249,
    currencyId: 'BRL',
    frequency: 1,
    frequencyType: 'months' as const,
    visitsPerMonth: null,
    users: null,
  },
} as const

export type PlanKey = keyof typeof BILLING_PLANS
```

### 2. `src/lib/plan-limits.ts` — refatorado

Passa a importar de `billing.ts` sem duplicar valores. `PLAN_LIMITS` é derivado de `BILLING_PLANS`.

### 3. `prisma/schema.prisma` — mudanças

**`Company.plan` passa a ser nullable:**
```prisma
plan String? // null = sem assinatura ativa
```

**Nova tabela `Subscription`:**
```prisma
model Subscription {
  id               String             @id @default(cuid())
  companyId        String             // sem @unique — permite ACTIVE + PENDING simultâneos
  mpSubscriptionId String?            @unique
  planKey          String
  status           SubscriptionStatus @default(PENDING)
  checkoutUrl      String?
  currentPeriodEnd DateTime?
  createdAt        DateTime           @default(now())
  updatedAt        DateTime           @updatedAt

  company Company @relation(fields: [companyId], references: [id])
}

enum SubscriptionStatus {
  PENDING
  ACTIVE
  PAUSED
  CANCELLED
}
```

`companyId` sem `@unique`: permite que exista uma ACTIVE (plano atual) e uma PENDING (upgrade em andamento) ao mesmo tempo. O webhook promove PENDING → ACTIVE e cancela a ACTIVE antiga somente após confirmação.

`mpSubscriptionId @unique` (nullable): garante que um mesmo ID do MP nunca é vinculado a dois registros (idempotência de webhook). Nullable porque o registro pode ser criado antes da resposta do MP chegar.

### 4. `src/app/api/subscriptions/route.ts` — novo

`POST` — cria assinatura no MP e salva no banco.

- Apenas `ADMIN` pode chamar (role check explícito — não SUPERADMIN nesse fluxo self-service)
- Busca email do ADMIN (exigido pelo MP como `payer_email`)
- Chama `POST https://api.mercadopago.com/preapproval` com config inline:

```json
{
  "reason": "<plan.description>",
  "external_reference": "<companyId>:<planKey>",
  "payer_email": "<admin_email>",
  "auto_recurring": {
    "frequency": 1,
    "frequency_type": "months",
    "transaction_amount": <plan.price>,
    "currency_id": "BRL"
  },
  "back_url": "<NEXT_PUBLIC_APP_URL>/dashboard/plano",
  "status": "pending"
}
```

- Se já existe Subscription para a empresa: cria nova linha PENDING (não cancela a atual — cancela só após webhook confirmar a nova)
- Salva `{ companyId, mpSubscriptionId, planKey, status: PENDING, checkoutUrl: init_point }`
- Retorna `{ checkoutUrl }`

### 5. `src/app/api/webhooks/mercadopago/route.ts` — novo

`POST` — recebe eventos do MP, atualiza banco.

**Fluxo:**
1. Valida assinatura `x-signature` (HMAC-SHA256 com `MP_WEBHOOK_SECRET`). Se `MP_WEBHOOK_SECRET` não está setado (sandbox local), pula validação.
2. Extrai `data.id` do payload
3. Busca `GET https://api.mercadopago.com/preapproval/{id}` — não confia no payload, usa a fonte canônica
4. Localiza `Subscription` por `mpSubscriptionId`. Se não encontrada → retorna 200 (ignora)
5. Verifica idempotência: se `Subscription.status` já é igual ao novo status mapeado → retorna 200 sem tocar no banco
6. Mapeia status do MP:

| Status MP | `Subscription.status` | Ação em `Company.plan` |
|---|---|---|
| `authorized` | ACTIVE | `= subscription.planKey` |
| `pending` | PENDING | nenhuma |
| `paused` | PAUSED | `= null` (apenas se era a única ACTIVE da empresa) |
| `cancelled` | CANCELLED | `= null` (apenas se era a única ACTIVE da empresa) |

7. **Transição → ACTIVE (upgrade seguro):**
   - Busca outras Subscriptions ACTIVE do mesmo `companyId`
   - Para cada uma: `PUT /preapproval/{oldId} {"status":"cancelled"}` no MP + marca CANCELLED no banco
   - Atualiza Subscription atual para ACTIVE
   - `Company.plan = subscription.planKey`
   - `Subscription.currentPeriodEnd = next_payment_date` da resposta do MP

8. **Transição → PAUSED ou CANCELLED:**
   - Verifica se há outra Subscription ACTIVE para a empresa
   - Se sim → só atualiza status, não toca `Company.plan` (empresa coberta pela outra)
   - Se não → atualiza status + `Company.plan = null`

9. Retorna 200

### 6. `src/app/dashboard/(protected)/layout.tsx` — novo

Route group que envolve todas as rotas do dashboard que exigem billing. `/dashboard/plano` fica **fora** do grupo e sempre acessível.

```
src/app/dashboard/
  layout.tsx                    ← auth apenas (sem mudança)
  plano/                        ← acessível sem billing
  (protected)/
    layout.tsx                  ← billing check
    page.tsx                    ← /dashboard (home)
    visitas/
    clientes/
    usuarios/
    relatorios/
```

`(protected)/layout.tsx`:
```ts
async function requireActivePlan(companyId: string) {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { plan: true },
  })
  if (!company?.plan) redirect('/dashboard/plano')
}
```

Nenhum middleware existente é tocado.

### 7. `src/components/plan-cards.tsx` — refatorado

- Remove referência ao WhatsApp (`WHATSAPP_URL`, `whatsappMsg`)
- Botão "Assinar" chama `POST /api/subscriptions` com o `planKey`
- Durante a chamada: estado de loading
- Após resposta: `window.location.href = checkoutUrl`
- Se empresa já tem Subscription PENDING para esse plano: botão "Retomar checkout" com link para `checkoutUrl` salvo
- Plano atual: botão desabilitado "Plano atual"

### 8. `src/app/dashboard/plano/page.tsx` — atualizado

Busca a Subscription ativa ou pendente da empresa e exibe bloco de status:

| Estado | Mensagem exibida |
|---|---|
| `plan = null`, sem Subscription | "Nenhuma assinatura ativa. Escolha um plano abaixo." |
| Subscription `PENDING` | "Pagamento pendente — finalize no Mercado Pago" + botão "Retomar checkout" |
| Subscription `ACTIVE` | "Plano X — ativo" + data do próximo vencimento (`currentPeriodEnd`) |
| Subscription `PAUSED` | "Pagamento com problema — regularize para reativar" |
| Subscription `CANCELLED` | "Assinatura cancelada. Escolha um plano abaixo." |

---

## Fluxo de upgrade seguro

```
Estado inicial: Subscription ACTIVE (pro) + Company.plan = 'pro'

1. ADMIN clica "Assinar enterprise"
2. POST /api/subscriptions → cria Subscription PENDING (enterprise)
   Estado: ACTIVE (pro) + PENDING (enterprise) coexistindo
3. ADMIN paga no MP
4. Webhook authorized → nova Subscription vira ACTIVE
   - Cancela ACTIVE (pro) no MP + CANCELLED no banco
   - Company.plan = 'enterprise'
   Estado final: ACTIVE (enterprise) + CANCELLED (pro)
```

A empresa nunca fica sem acesso durante o upgrade.

---

## Fluxo de novo cliente

```
1. Empresa criada (SUPERADMIN ou /cadastro) com Company.plan = null
2. ADMIN acessa dashboard → redirecionado para /dashboard/plano
3. Escolhe plano → POST /api/subscriptions → redirecionado ao MP
4. Paga → webhook authorized → Company.plan = 'start'/'pro'/'enterprise'
5. Dashboard liberado
```

---

## Arquivos criados ou modificados

| Arquivo | Ação |
|---|---|
| `src/lib/billing.ts` | Criar |
| `src/lib/plan-limits.ts` | Modificar (importar de billing.ts) |
| `prisma/schema.prisma` | Modificar (plan nullable, tabela Subscription) |
| `src/app/api/subscriptions/route.ts` | Criar |
| `src/app/api/webhooks/mercadopago/route.ts` | Criar |
| `src/app/dashboard/(protected)/layout.tsx` | Criar |
| `src/app/dashboard/(protected)/page.tsx` | Mover (de dashboard/page.tsx) |
| `src/app/dashboard/(protected)/visitas/` | Mover |
| `src/app/dashboard/(protected)/clientes/` | Mover |
| `src/app/dashboard/(protected)/usuarios/` | Mover |
| `src/app/dashboard/(protected)/relatorios/` | Mover |
| `src/components/plan-cards.tsx` | Modificar |
| `src/app/dashboard/plano/page.tsx` | Modificar |

---

## O que está fora do escopo (MVP)

- Portal de cancelamento self-service (ADMIN cancela pela própria UI)
- Emails transacionais de billing (confirmação, falha de pagamento)
- Histórico de faturas
- Downgrade de plano pelo ADMIN
- Período de trial

Essas funcionalidades são adicionadas em iterações futuras.
