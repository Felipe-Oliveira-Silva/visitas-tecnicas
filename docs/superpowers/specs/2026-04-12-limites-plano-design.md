# Subsistema 3 — Limites de Plano + Barra de Progresso — Design Spec

**Data:** 2026-04-12  
**Status:** Aprovado

## Objetivo

Implementar controle de limites por plano (visitas/mês e usuários ativos), com barra de progresso visual no dashboard, página dedicada de plano, bloqueio na API com modal de upgrade, e atualização dos preços/limites na landing page.

## Limites por Plano

| Plano | DB key | Visitas/mês | Usuários | Preço |
|---|---|---|---|---|
| Básico | `start` | 30 | 2 | R$49 |
| Profissional | `pro` | 300 | 10 | R$109 |
| Premium | `enterprise` | ilimitado (`null`) | ilimitado (`null`) | R$249 |

`null` = sem limite. O campo `Company.plan` já existe no schema Prisma.

## Arquitetura Geral

- **Helper centralizado** em `src/lib/plan-limits.ts`: constantes + funções de check + `getUsage()`. Sem endpoint novo por agora — Server Components chamam `getUsage()` diretamente.
- **Enforcement no backend**: cada rota API verifica o limite antes de criar. Retorna objeto estruturado, não lança exceção.
- **Concorrência**: race condition entre count e create é aceita como trade-off neste estágio.
- **Storage**: fora do escopo desta fase. O helper é estruturado para receber storage no futuro sem reescrita.

---

## 1. `src/lib/plan-limits.ts`

### Constantes

```ts
export const PLAN_LIMITS: Record<string, { visitsPerMonth: number | null; users: number | null }> = {
  start:      { visitsPerMonth: 30,   users: 2  },
  pro:        { visitsPerMonth: 300,  users: 10 },
  enterprise: { visitsPerMonth: null, users: null },
}
```

### Funções exportadas

```ts
// Retorna uso atual da empresa
export async function getUsage(companyId: string): Promise<{
  visitsThisMonth: number
  activeUsers: number
}>

// Verifica se pode criar nova visita
export async function checkVisitLimit(companyId: string): Promise<{
  allowed: boolean
  limit: number | null
  current: number
}>

// Verifica se pode criar novo usuário
export async function checkUserLimit(companyId: string): Promise<{
  allowed: boolean
  limit: number | null
  current: number
}>
```

### Funções internas

```ts
// Centraliza cálculo do intervalo do mês corrente em UTC — reutilizado em getUsage e checkVisitLimit
function getMonthRangeUTC(): { gte: Date; lt: Date }

// Evita repetição de leitura do plano nos checks
// Lança erro explícito se company não encontrada ou plan não reconhecido em PLAN_LIMITS
async function getCompanyPlan(companyId: string): Promise<string>
```

### Lógica de `getMonthRangeUTC`

Calcula o intervalo `[início do mês corrente, início do próximo mês)` em UTC:
```ts
const now = new Date()
const gte = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
const lt  = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1))
return { gte, lt }
```

### Lógica de `getCompanyPlan`

```ts
const company = await prisma.company.findUnique({ where: { id: companyId }, select: { plan: true } })
if (!company) throw new Error(`Company not found: ${companyId}`)
if (!PLAN_LIMITS[company.plan]) throw new Error(`Unknown plan: ${company.plan}`)
return company.plan
```

### Lógica de `getUsage`

```ts
const { gte, lt } = getMonthRangeUTC()
const [visitsThisMonth, activeUsers] = await Promise.all([
  prisma.visit.count({ where: { companyId, createdAt: { gte, lt } } }),
  prisma.user.count({ where: { companyId, active: true } }),
])
return { visitsThisMonth, activeUsers }
```

### Lógica de `checkVisitLimit`

1. `plan = await getCompanyPlan(companyId)` (lança se inválido)
2. `limit = PLAN_LIMITS[plan].visitsPerMonth`
3. Se `limit === null` → `{ allowed: true, limit: null, current: 0 }`
4. `current = prisma.visit.count` usando `getMonthRangeUTC()`
5. `{ allowed: current < limit, limit, current }`

### Lógica de `checkUserLimit`

1. `plan = await getCompanyPlan(companyId)` (lança se inválido)
2. `limit = PLAN_LIMITS[plan].users`
3. Se `limit === null` → `{ allowed: true, limit: null, current: 0 }`
4. `current = prisma.user.count({ where: { companyId, active: true } })`
5. `{ allowed: current < limit, limit, current }`

---

## 2. Enforcement nas Rotas API

### `POST /api/visitas`

Após auth check, antes de criar:

```ts
const check = await checkVisitLimit(session.user.companyId)
if (!check.allowed) {
  return NextResponse.json({
    error: 'LIMIT_REACHED',
    resource: 'visits',
    limit: check.limit,
    current: check.current,
    message: `Você atingiu o limite de ${check.limit} visitas este mês. Faça upgrade para continuar registrando visitas.`,
  }, { status: 403 })
}
```

### `POST /api/usuarios`

Após auth check, antes de criar:

```ts
const check = await checkUserLimit(session.user.companyId)
if (!check.allowed) {
  return NextResponse.json({
    error: 'LIMIT_REACHED',
    resource: 'users',
    limit: check.limit,
    current: check.current,
    message: `Você atingiu o limite de ${check.limit} usuários do seu plano. Faça upgrade para adicionar mais usuários.`,
  }, { status: 403 })
}
```

---

## 3. Componente `src/components/usage-bar.tsx`

Server Component simples (sem interatividade). Props:

```ts
interface UsageBarProps {
  label: string
  current: number
  limit: number | null  // null = ilimitado
}
```

Comportamento:
- `limit === null` → barra em estado neutro (sem preenchimento percentual), texto "X (Ilimitado)" — ex: "128 (Ilimitado)"
- `percentage < 80` → barra cyan (cor neutra do sistema, não "verde de sucesso")
- `percentage >= 80 && < 100` → barra amarela (aviso)
- `percentage >= 100` → barra vermelha (bloqueio)

Exibe: label, `current / limit` (ou `current (Ilimitado)`), barra colorida, percentual (oculto quando ilimitado.

---

## 4. Widget de Uso no Dashboard (`src/app/dashboard/page.tsx`)

Adicionar ao final do Server Component existente:

```ts
const usage = await getUsage(companyId)
const companyData = await prisma.company.findUnique({
  where: { id: companyId },
  select: { plan: true }
})
// Sem fallback silencioso — getCompanyPlan lança se plano for inválido
const limits = PLAN_LIMITS[companyData.plan]
```

Widget renderizado abaixo dos 4 cards existentes:

```
┌──────────────────────────────────────────────────────┐
│  Uso do Plano — Básico                               │
│                                                      │
│  Visitas este mês    23 / 30  ████████████░░  76%   │
│  Usuários ativos      1 / 2   ██████████░░░░  50%   │
│                                                      │
│  Reinicia em 12 dias · Ver detalhes →                │
└──────────────────────────────────────────────────────┘
```

- "Reinicia em X dias" = dias até o 1º do próximo mês, calculado no servidor
- "Ver detalhes →" linka para `/dashboard/plano`
- Para Enterprise: sem contagem, exibe "Ilimitado" nas barras

---

## 5. Página `/dashboard/plano`

Nova página Server Component visível apenas para `ADMIN` e `SUPERADMIN`.

**Bloco 1 — Plano atual:**
Nome do plano (Básico/Profissional/Premium), preço, badge "Ativo".

**Bloco 2 — Uso detalhado:**
Dois `UsageBar` com label, contagem e data de reset das visitas (1º do próximo mês). Mensagem de aviso quando barra amarela ou vermelha.

**Bloco 3 — Upgrade:**
Reutiliza `PlanCards` passando `userName` da sessão e `currentPlan` (ex: `'start'`). O componente `PlanCards` precisará de uma nova prop opcional `currentPlan?: string` — o card correspondente recebe badge "Seu plano atual" e botão desabilitado. Os outros planos exibem botão WhatsApp com mensagem pré-preenchida.

### Sidebar

Adicionar item "⚡ Plano" no sidebar (`src/components/sidebar.tsx`), visível apenas para `ADMIN` e `SUPERADMIN`, linkando para `/dashboard/plano`.

---

## 6. Botões Bloqueados nas Páginas de Listagem

As páginas `/dashboard/usuarios` e `/dashboard/visitas` são Server Components. Ao carregar, chamam `getUsage()` e verificam contra `PLAN_LIMITS[plan]`. Se no limite:

- Botão "Novo Usuário" / "Nova Visita" fica desabilitado (`disabled`, `cursor-not-allowed`, cor cinza)
- Tooltip: "Limite do plano atingido"

---

## 7. Modal de Upgrade (`src/components/upgrade-modal.tsx`)

Client Component reutilizável entre formulários de nova visita e novo usuário.

Props:
```ts
interface UpgradeModalProps {
  open: boolean
  onClose: () => void
  resource: 'visits' | 'users'
  limit: number
  current: number
}
```

Conteúdo:
- Título: "Limite atingido 🚫"
- Mensagem: ex. "Você usou 30/30 visitas este mês."
- Botão primário: "💬 Fazer upgrade via WhatsApp" → `wa.me/5511916821634?text=<mensagem pré-preenchida>`
- Botão secundário: "Fechar"

Mensagem WhatsApp pré-preenchida: `"Olá! Atingi o limite do meu plano e gostaria de fazer upgrade."`

**Integração nos formulários:**
Quando `POST /api/visitas` ou `POST /api/usuarios` retorna `{ error: 'LIMIT_REACHED' }`, o formulário abre `<UpgradeModal>` em vez de exibir o erro inline.

---

## 8. Atualização da Landing Page

### `src/components/plan-cards.tsx`

Atualizar preços e mensagens WhatsApp:

| Plano | Preço antigo | Preço novo |
|---|---|---|
| Básico | R$50/mês | R$49/mês |
| Profissional | R$110/mês | R$109/mês |
| Premium | R$250/mês | R$249/mês |

Mensagens WhatsApp atualizadas com novos valores.

### `src/app/page.tsx` (FAQ)

Sem alteração necessária (FAQ já não menciona valores específicos).

---

## Arquivos Afetados

| Arquivo | Ação |
|---|---|
| `src/lib/plan-limits.ts` | Criar |
| `src/components/usage-bar.tsx` | Criar |
| `src/components/upgrade-modal.tsx` | Criar |
| `src/app/dashboard/page.tsx` | Modificar — adicionar widget de uso |
| `src/app/dashboard/plano/page.tsx` | Criar |
| `src/components/sidebar.tsx` | Modificar — adicionar item "Plano" |
| `src/app/dashboard/visitas/page.tsx` | Modificar — botão desabilitado |
| `src/app/dashboard/usuarios/page.tsx` | Modificar — botão desabilitado |
| `src/app/api/visitas/route.ts` | Modificar — check de limite |
| `src/app/api/usuarios/route.ts` | Modificar — check de limite |
| `src/app/dashboard/visitas/novo/page.tsx` | Modificar — integrar UpgradeModal |
| `src/app/dashboard/usuarios/novo/page.tsx` | Modificar — integrar UpgradeModal |
| `src/components/plan-cards.tsx` | Modificar — preços atualizados + prop `currentPlan` |

## O que NÃO está no escopo

- Controle de armazenamento (MB/GB) — fase futura
- Endpoint `/api/usage` — criar quando storage entrar
- Hard delete de relatórios
- Downgrade de plano via sistema
- Notificações por e-mail ao atingir limite
