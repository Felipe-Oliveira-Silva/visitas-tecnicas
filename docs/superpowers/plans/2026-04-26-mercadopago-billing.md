# Mercado Pago Billing — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir o fluxo WhatsApp por assinaturas recorrentes reais via Mercado Pago Preapproval, bloqueando acesso ao dashboard até pagamento confirmado via webhook.

**Architecture:** `billing.ts` centraliza preços/limites. Self-service cria `Subscription PENDING` + redireciona para MP checkout. Webhook confirma `ACTIVE` e atualiza `Company.plan`. Route group `(protected)` bloqueia todo o dashboard exceto `/dashboard/plano`. Nenhum middleware existente é modificado.

**Tech Stack:** Next.js 16.2.2 App Router, Prisma 6, PostgreSQL (Neon), Mercado Pago REST API (fetch nativo — sem SDK), bcryptjs, NextAuth v5 beta

---

## File Map

| Arquivo | Ação |
|---|---|
| `src/lib/billing.ts` | Criar — helper central de planos |
| `src/lib/plan-limits.ts` | Modificar — importar de billing.ts |
| `prisma/schema.prisma` | Modificar — plan nullable, modelo Subscription |
| `prisma/migrations/...` | Criar via `prisma migrate dev` |
| `src/app/api/cadastro/route.ts` | Modificar — plan: null para novos cadastros |
| `src/app/dashboard/(protected)/layout.tsx` | Criar — billing gate |
| `src/app/dashboard/(protected)/page.tsx` | Mover de `dashboard/page.tsx` |
| `src/app/dashboard/(protected)/clientes/` | Mover |
| `src/app/dashboard/(protected)/relatorios/` | Mover |
| `src/app/dashboard/(protected)/usuarios/` | Mover |
| `src/app/dashboard/(protected)/visitas/` | Mover |
| `src/app/api/subscriptions/route.ts` | Criar — POST cria preapproval no MP |
| `src/app/api/webhooks/mercadopago/route.ts` | Criar — recebe eventos do MP |
| `src/components/plan-cards.tsx` | Modificar — botões MP em vez de WhatsApp |
| `src/app/dashboard/plano/page.tsx` | Modificar — bloco de status da assinatura |

---

### Task 1: `src/lib/billing.ts` + refatorar `src/lib/plan-limits.ts`

**Files:**
- Create: `src/lib/billing.ts`
- Modify: `src/lib/plan-limits.ts`

- [ ] **Step 1: Criar `src/lib/billing.ts`**

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

- [ ] **Step 2: Substituir conteúdo de `src/lib/plan-limits.ts`**

```ts
import { prisma } from '@/lib/prisma'
import { BILLING_PLANS, PlanKey } from './billing'

export { PlanKey } from './billing'

export const PLAN_LIMITS: Record<PlanKey, { visitsPerMonth: number | null; users: number | null }> = {
  start:      { visitsPerMonth: BILLING_PLANS.start.visitsPerMonth,      users: BILLING_PLANS.start.users      },
  pro:        { visitsPerMonth: BILLING_PLANS.pro.visitsPerMonth,        users: BILLING_PLANS.pro.users        },
  enterprise: { visitsPerMonth: BILLING_PLANS.enterprise.visitsPerMonth, users: BILLING_PLANS.enterprise.users },
}

function getMonthRangeUTC(): { gte: Date; lt: Date } {
  const now = new Date()
  const gte = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
  const lt  = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1))
  return { gte, lt }
}

async function getCompanyPlan(companyId: string): Promise<PlanKey> {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { plan: true },
  })
  if (!company) throw new Error(`Company not found: ${companyId}`)
  const plan = company.plan
  if (!plan || !PLAN_LIMITS[plan as PlanKey]) throw new Error(`No active plan for company: ${companyId}`)
  return plan as PlanKey
}

export async function getUsage(companyId: string): Promise<{
  visitsThisMonth: number
  activeUsers: number
}> {
  const { gte, lt } = getMonthRangeUTC()
  const [visitsThisMonth, activeUsers] = await Promise.all([
    prisma.visit.count({ where: { companyId, createdAt: { gte, lt } } }),
    prisma.user.count({ where: { companyId, active: true } }),
  ])
  return { visitsThisMonth, activeUsers }
}

export async function checkVisitLimit(companyId: string): Promise<{
  allowed: boolean
  limit: number | null
  current: number
}> {
  const plan = await getCompanyPlan(companyId)
  const limit = PLAN_LIMITS[plan].visitsPerMonth
  if (limit === null) return { allowed: true, limit: null, current: 0 }
  const { gte, lt } = getMonthRangeUTC()
  const current = await prisma.visit.count({ where: { companyId, createdAt: { gte, lt } } })
  return { allowed: current < limit, limit, current }
}

export async function checkUserLimit(companyId: string): Promise<{
  allowed: boolean
  limit: number | null
  current: number
}> {
  const plan = await getCompanyPlan(companyId)
  const limit = PLAN_LIMITS[plan].users
  if (limit === null) return { allowed: true, limit: null, current: 0 }
  const current = await prisma.user.count({ where: { companyId, active: true } })
  return { allowed: current < limit, limit, current }
}
```

- [ ] **Step 3: Verificar build**

```bash
npm run build
```

Esperado: sem erros de TypeScript.

- [ ] **Step 4: Commit**

```bash
git add src/lib/billing.ts src/lib/plan-limits.ts
git commit -m "feat: add billing.ts as single source of truth for plan config"
```

---

### Task 2: Prisma — Company.plan nullable + modelo Subscription

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `src/app/api/cadastro/route.ts`

- [ ] **Step 1: Modificar `prisma/schema.prisma`**

No bloco `Company`, trocar:
```prisma
plan      String   @default("start")
```
por:
```prisma
plan      String?
```

Após o enum `Role`, adicionar o enum e o modelo:

```prisma
enum SubscriptionStatus {
  PENDING
  ACTIVE
  PAUSED
  CANCELLED
}

model Subscription {
  id               String             @id @default(cuid())
  companyId        String
  mpSubscriptionId String?            @unique
  planKey          String
  status           SubscriptionStatus @default(PENDING)
  checkoutUrl      String?
  currentPeriodEnd DateTime?
  createdAt        DateTime           @default(now())
  updatedAt        DateTime           @updatedAt

  company Company @relation(fields: [companyId], references: [id])
}
```

Adicionar a relação inversa no bloco `Company` (junto com `users`, `clients`, etc.):
```prisma
subscriptions Subscription[]
```

- [ ] **Step 2: Criar migration**

```bash
npx prisma migrate dev --name add-subscription-billing
```

Esperado:
```
✓ Generated Prisma Client
The following migration(s) have been created and applied from new schema changes:
  migrations/XXXXXXXXXX_add_subscription_billing/migration.sql
```

- [ ] **Step 3: Confirmar migration SQL gerada**

Abrir o arquivo `prisma/migrations/XXXXXXXXXX_add_subscription_billing/migration.sql` e verificar:
- `ALTER COLUMN "plan" DROP NOT NULL` (ou `DROP DEFAULT` + nullable)
- `CREATE TYPE "SubscriptionStatus"` com os 4 valores
- `CREATE TABLE "Subscription"` com todos os campos

- [ ] **Step 4: Atualizar `src/app/api/cadastro/route.ts`**

Localizar a linha que define o plano na criação da empresa (linha ~37):
```ts
plan: 'start',
```
Substituir por:
```ts
plan: null,
```

Isso garante que empresas auto-cadastradas começam sem plano ativo e precisam passar pelo billing.

- [ ] **Step 5: Verificar build**

```bash
npm run build
```

Esperado: o TypeScript pode apontar erros em arquivos que assumem `company.plan` não-nulo. Anote os arquivos com erro — serão corrigidos nas próximas tasks.

- [ ] **Step 6: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/ src/app/api/cadastro/route.ts
git commit -m "feat: make Company.plan nullable, add Subscription model"
```

---

### Task 3: Route group `(protected)` — billing gate

**Files:**
- Create: `src/app/dashboard/(protected)/layout.tsx`
- Move: `src/app/dashboard/page.tsx` → `src/app/dashboard/(protected)/page.tsx`
- Move: `src/app/dashboard/clientes/` → `src/app/dashboard/(protected)/clientes/`
- Move: `src/app/dashboard/relatorios/` → `src/app/dashboard/(protected)/relatorios/`
- Move: `src/app/dashboard/usuarios/` → `src/app/dashboard/(protected)/usuarios/`
- Move: `src/app/dashboard/visitas/` → `src/app/dashboard/(protected)/visitas/`

- [ ] **Step 1: Criar `src/app/dashboard/(protected)/layout.tsx`**

```ts
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session) redirect('/login')

  const company = await prisma.company.findUnique({
    where: { id: session.user.companyId },
    select: { plan: true },
  })

  if (!company?.plan) redirect('/dashboard/plano')

  return <>{children}</>
}
```

- [ ] **Step 2: Mover arquivos para o route group**

```bash
mkdir -p "src/app/dashboard/(protected)"
git mv "src/app/dashboard/page.tsx" "src/app/dashboard/(protected)/page.tsx"
git mv "src/app/dashboard/clientes" "src/app/dashboard/(protected)/clientes"
git mv "src/app/dashboard/relatorios" "src/app/dashboard/(protected)/relatorios"
git mv "src/app/dashboard/usuarios" "src/app/dashboard/(protected)/usuarios"
git mv "src/app/dashboard/visitas" "src/app/dashboard/(protected)/visitas"
```

- [ ] **Step 3: Corrigir `src/app/dashboard/(protected)/page.tsx`**

O arquivo usa `companyData!.plan as 'start' | 'pro' | 'enterprise'`. Como o layout garante que `plan` não é null nesse contexto, usar asserção explícita:

Localizar a linha (~33):
```ts
const limits = PLAN_LIMITS[companyData!.plan as 'start' | 'pro' | 'enterprise']
```
Substituir por:
```ts
const limits = PLAN_LIMITS[(companyData!.plan ?? 'start') as PlanKey]
```

Adicionar o import de `PlanKey` no topo do arquivo:
```ts
import { getUsage, PLAN_LIMITS } from '@/lib/plan-limits'
import { PlanKey } from '@/lib/billing'
```

- [ ] **Step 4: Verificar build**

```bash
npm run build
```

Esperado: sem erros de compilação. As URLs `/dashboard/visitas`, `/dashboard/clientes` etc. continuam funcionando — route groups não afetam URLs.

- [ ] **Step 5: Testar navegação manualmente**

Iniciar o servidor:
```bash
npm run dev
```

Com uma conta cuja empresa tem `plan != null` (ex: `super@relatec.com.br`):
- Acessar `/dashboard` → deve renderizar normalmente
- Acessar `/dashboard/visitas` → deve renderizar normalmente
- Acessar `/dashboard/plano` → deve renderizar normalmente

Com uma conta cuja empresa tem `plan = null` (criar via psql ou atualizar seed):
```sql
UPDATE "Company" SET plan = NULL WHERE id = 'algum-id';
```
- Qualquer rota do dashboard exceto `/dashboard/plano` deve redirecionar para `/dashboard/plano`

- [ ] **Step 6: Commit**

```bash
git add "src/app/dashboard/(protected)/"
git commit -m "feat: add (protected) route group with billing gate"
```

---

### Task 4: `POST /api/subscriptions` — criar assinatura no MP

**Files:**
- Create: `src/app/api/subscriptions/route.ts`

- [ ] **Step 1: Criar `src/app/api/subscriptions/route.ts`**

```ts
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { BILLING_PLANS, PlanKey } from '@/lib/billing'

const MP_API = 'https://api.mercadopago.com'

async function mpPost(path: string, body: unknown): Promise<{ id: string; init_point: string }> {
  const res = await fetch(`${MP_API}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`MP API ${res.status}: ${await res.text()}`)
  return res.json()
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  }

  const body = await req.json() as { planKey?: PlanKey }
  const planKey = body.planKey
  if (!planKey || !BILLING_PLANS[planKey]) {
    return NextResponse.json({ error: 'Plano inválido' }, { status: 400 })
  }

  const plan = BILLING_PLANS[planKey]
  const companyId = session.user.companyId

  const admin = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true },
  })
  if (!admin) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })

  const mpData = await mpPost('/preapproval', {
    reason: plan.description,
    external_reference: `${companyId}:${planKey}`,
    payer_email: admin.email,
    auto_recurring: {
      frequency: plan.frequency,
      frequency_type: plan.frequencyType,
      transaction_amount: plan.price,
      currency_id: plan.currencyId,
    },
    back_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/plano`,
    status: 'pending',
  })

  await prisma.subscription.create({
    data: {
      companyId,
      mpSubscriptionId: mpData.id,
      planKey,
      status: 'PENDING',
      checkoutUrl: mpData.init_point,
    },
  })

  return NextResponse.json({ checkoutUrl: mpData.init_point })
}
```

- [ ] **Step 2: Verificar build**

```bash
npm run build
```

Esperado: sem erros de TypeScript.

- [ ] **Step 3: Testar com curl (sandbox)**

Antes de testar, garantir que `MP_ACCESS_TOKEN` está setado no `.env` com o token sandbox (`TEST-...`).

```bash
# Login primeiro e pegar o cookie de sessão, depois:
curl -X POST http://localhost:3000/api/subscriptions \
  -H "Content-Type: application/json" \
  -b "<cookie_de_sessão>" \
  -d '{"planKey":"pro"}'
```

Esperado: `{"checkoutUrl":"https://www.mercadopago.com.br/subscriptions/..."}` e um registro na tabela `Subscription` com `status = PENDING`.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/subscriptions/route.ts
git commit -m "feat: POST /api/subscriptions — create MP preapproval inline"
```

---

### Task 5: `POST /api/webhooks/mercadopago` — handler de eventos

**Files:**
- Create: `src/app/api/webhooks/mercadopago/route.ts`

- [ ] **Step 1: Criar `src/app/api/webhooks/mercadopago/route.ts`**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createHmac } from 'crypto'

const MP_API = 'https://api.mercadopago.com'

type MPStatus = 'authorized' | 'pending' | 'paused' | 'cancelled'
type OurStatus = 'ACTIVE' | 'PENDING' | 'PAUSED' | 'CANCELLED'

const STATUS_MAP: Record<MPStatus, OurStatus> = {
  authorized: 'ACTIVE',
  pending:    'PENDING',
  paused:     'PAUSED',
  cancelled:  'CANCELLED',
}

function validateSignature(
  xSig: string | null,
  xReqId: string | null,
  dataId: string,
  secret: string
): boolean {
  if (!xSig || !xReqId) return false
  const parts = Object.fromEntries(xSig.split(',').map((p) => p.split('=')))
  const { ts, v1 } = parts as { ts?: string; v1?: string }
  if (!ts || !v1) return false
  const manifest = `id:${dataId};request-id:${xReqId};ts:${ts};`
  const hmac = createHmac('sha256', secret).update(manifest).digest('hex')
  return hmac === v1
}

type MPPreapproval = {
  id: string
  status: MPStatus
  next_payment_date?: string
  external_reference?: string
}

type WebhookPayload = {
  type: string
  data: { id: string }
}

export async function POST(req: NextRequest) {
  const body = await req.json() as WebhookPayload

  if (body.type !== 'subscription_preapproval') {
    return NextResponse.json({ received: true })
  }

  const mpId = body.data.id
  const secret = process.env.MP_WEBHOOK_SECRET

  if (secret) {
    const valid = validateSignature(
      req.headers.get('x-signature'),
      req.headers.get('x-request-id'),
      mpId,
      secret
    )
    if (!valid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }
  }

  // Fetch canonical state — never trust webhook payload alone
  const mpRes = await fetch(`${MP_API}/preapproval/${mpId}`, {
    headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` },
  })
  if (!mpRes.ok) {
    return NextResponse.json({ error: 'MP fetch failed' }, { status: 500 })
  }
  const mp = await mpRes.json() as MPPreapproval

  const subscription = await prisma.subscription.findUnique({
    where: { mpSubscriptionId: mpId },
  })
  if (!subscription) return NextResponse.json({ received: true })

  const newStatus: OurStatus = STATUS_MAP[mp.status] ?? subscription.status

  // Idempotency
  if (subscription.status === newStatus) return NextResponse.json({ received: true })

  if (newStatus === 'ACTIVE') {
    // Cancel any other ACTIVE subscriptions for this company
    const otherActives = await prisma.subscription.findMany({
      where: {
        companyId: subscription.companyId,
        status: 'ACTIVE',
        id: { not: subscription.id },
      },
    })

    for (const old of otherActives) {
      if (old.mpSubscriptionId) {
        await fetch(`${MP_API}/preapproval/${old.mpSubscriptionId}`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: 'cancelled' }),
        })
      }
      await prisma.subscription.update({
        where: { id: old.id },
        data: { status: 'CANCELLED' },
      })
    }

    await prisma.$transaction([
      prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          status: 'ACTIVE',
          currentPeriodEnd: mp.next_payment_date ? new Date(mp.next_payment_date) : null,
        },
      }),
      prisma.company.update({
        where: { id: subscription.companyId },
        data: { plan: subscription.planKey },
      }),
    ])
  } else if (newStatus === 'PAUSED' || newStatus === 'CANCELLED') {
    // Only revoke plan access if this subscription was the active one AND no other ACTIVE exists
    const hasOtherActive = await prisma.subscription.findFirst({
      where: {
        companyId: subscription.companyId,
        status: 'ACTIVE',
        id: { not: subscription.id },
      },
    })

    if (!hasOtherActive && subscription.status === 'ACTIVE') {
      await prisma.$transaction([
        prisma.subscription.update({
          where: { id: subscription.id },
          data: { status: newStatus },
        }),
        prisma.company.update({
          where: { id: subscription.companyId },
          data: { plan: null },
        }),
      ])
    } else {
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: { status: newStatus },
      })
    }
  } else {
    // PENDING — just update status, no change to Company.plan
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: newStatus },
    })
  }

  return NextResponse.json({ received: true })
}
```

- [ ] **Step 2: Verificar build**

```bash
npm run build
```

Esperado: sem erros.

- [ ] **Step 3: Testar webhook com curl (simular evento authorized)**

Criar primeiro uma assinatura PENDING via a rota anterior, então simular o evento:

```bash
curl -X POST http://localhost:3000/api/webhooks/mercadopago \
  -H "Content-Type: application/json" \
  -d '{
    "type": "subscription_preapproval",
    "action": "updated",
    "data": { "id": "<mpSubscriptionId_do_banco>" }
  }'
```

**Nota:** sem `MP_WEBHOOK_SECRET` setado localmente, a validação de assinatura é pulada. O handler vai buscar o recurso no MP — em sandbox, o status retornado deve ser `pending` (pois não houve pagamento real). Para testar a lógica de `authorized`, é necessário usar a UI do MP sandbox para aprovar um pagamento, ou setar diretamente no banco para simular: `UPDATE "Subscription" SET status = 'ACTIVE' WHERE ...`.

Esperado na resposta: `{"received":true}` com status 200 em qualquer caso.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/webhooks/mercadopago/route.ts
git commit -m "feat: POST /api/webhooks/mercadopago — idempotent subscription lifecycle handler"
```

---

### Task 6: UI — PlanCards + `/dashboard/plano` com status da assinatura

**Files:**
- Modify: `src/components/plan-cards.tsx`
- Modify: `src/app/dashboard/plano/page.tsx`

- [ ] **Step 1: Substituir conteúdo de `src/components/plan-cards.tsx`**

```tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { BILLING_PLANS } from '@/lib/billing'

const PLANS = [
  { ...BILLING_PLANS.start, subtitle: 'Para começar', popular: false, features: ['Até 2 usuários', 'Até 30 visitas/mês', 'Relatórios simples', 'Assinatura básica'] },
  { ...BILLING_PLANS.pro,   subtitle: 'Para equipes',  popular: true,  features: ['Até 10 usuários', 'Até 300 visitas/mês', 'Dashboard completo', 'Filtros avançados'] },
  { ...BILLING_PLANS.enterprise, subtitle: 'White-label total', popular: false, features: ['Usuários ilimitados', 'Visitas ilimitadas', 'White-label completo', 'PDF profissional'] },
]

interface CurrentSubscription {
  planKey: string
  status: 'PENDING' | 'ACTIVE' | 'PAUSED' | 'CANCELLED'
  checkoutUrl: string | null
}

interface PlanCardsProps {
  currentPlan?: string | null
  currentSubscription?: CurrentSubscription | null
}

export function PlanCards({ currentPlan, currentSubscription }: PlanCardsProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string>('')

  async function handleSubscribe(planKey: string) {
    setLoading(planKey)
    setError('')
    try {
      const res = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planKey }),
      })
      const data = await res.json() as { checkoutUrl?: string; error?: string }
      if (res.ok && data.checkoutUrl) {
        window.location.href = data.checkoutUrl
      } else {
        setError(data.error ?? 'Erro ao criar assinatura')
      }
    } catch {
      setError('Erro de conexão')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">
          {error}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        {PLANS.map((plan) => {
          const isCurrent = currentPlan === plan.key
          const isPending = currentSubscription?.planKey === plan.key && currentSubscription.status === 'PENDING'

          return (
            <div
              key={plan.key}
              className={`bg-[#0d1b2a] rounded-xl p-6 text-left flex flex-col relative ${
                plan.popular
                  ? 'border-2 border-cyan-500'
                  : 'border border-[#1e3a5f]'
              }`}
            >
              {plan.popular && !isCurrent && (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-cyan-500 text-white text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
                  Mais popular
                </span>
              )}
              {isCurrent && (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-slate-600 text-slate-200 text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
                  Seu plano atual
                </span>
              )}

              <p className={`text-xs uppercase tracking-widest mb-2 ${plan.popular ? 'text-cyan-500' : 'text-slate-400'}`}>
                {plan.name}
              </p>
              <p className="text-3xl font-extrabold text-slate-100 mb-1">
                R${plan.price}
                <span className="text-base font-normal text-slate-500">/mês</span>
              </p>
              <p className="text-slate-500 text-sm mb-6">{plan.subtitle}</p>

              <ul className="flex-1 space-y-2 mb-6 text-sm text-slate-400">
                {plan.features.map((f) => (
                  <li key={f}>✓ {f}</li>
                ))}
              </ul>

              {isCurrent ? (
                <button
                  disabled
                  className="block w-full text-center py-2.5 rounded-lg text-sm font-semibold bg-slate-700 text-slate-500 cursor-not-allowed"
                >
                  Plano atual
                </button>
              ) : isPending && currentSubscription?.checkoutUrl ? (
                <a
                  href={currentSubscription.checkoutUrl}
                  className="block text-center bg-amber-500 hover:bg-amber-400 text-white py-2.5 rounded-lg text-sm font-semibold transition-colors"
                >
                  Retomar pagamento
                </a>
              ) : (
                <button
                  onClick={() => handleSubscribe(plan.key)}
                  disabled={loading === plan.key}
                  className={`block w-full text-center py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                    plan.popular
                      ? 'bg-cyan-500 hover:bg-cyan-400 text-white disabled:opacity-50'
                      : 'border border-cyan-500 text-cyan-500 hover:bg-cyan-500/10 disabled:opacity-50'
                  }`}
                >
                  {loading === plan.key ? 'Aguarde...' : 'Assinar'}
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Substituir conteúdo de `src/app/dashboard/plano/page.tsx`**

```tsx
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getUsage, PLAN_LIMITS } from '@/lib/plan-limits'
import { BILLING_PLANS, PlanKey } from '@/lib/billing'
import { UsageBar } from '@/components/usage-bar'
import { PlanCards } from '@/components/plan-cards'
import { CreditCard, AlertTriangle, CheckCircle2, Clock, AlertCircle, XCircle } from 'lucide-react'

export default async function PlanoPage() {
  const session = await auth()
  if (!session) redirect('/login')
  if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPERADMIN') {
    redirect('/dashboard')
  }

  const companyId = session.user.companyId

  const [usage, company, subscription] = await Promise.all([
    getUsage(companyId),
    prisma.company.findUnique({
      where: { id: companyId },
      select: { plan: true, name: true },
    }),
    prisma.subscription.findFirst({
      where: { companyId },
      orderBy: { updatedAt: 'desc' },
    }),
  ])

  const planKey = company?.plan as PlanKey | null
  const limits = planKey ? PLAN_LIMITS[planKey] : null
  const planInfo = planKey ? BILLING_PLANS[planKey] : null

  const now = new Date()
  const nextMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1))
  const resetDate = nextMonth.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })

  const visitPct = limits?.visitsPerMonth
    ? Math.round((usage.visitsThisMonth / limits.visitsPerMonth) * 100)
    : null
  const userPct = limits?.users
    ? Math.round((usage.activeUsers / limits.users) * 100)
    : null
  const showVisitWarning = visitPct !== null && visitPct >= 80
  const showUserWarning = userPct !== null && userPct >= 80

  function subscriptionStatusBlock() {
    if (!subscription) {
      return (
        <div className="flex items-center gap-3 text-slate-400 text-sm">
          <AlertCircle size={16} className="text-slate-500" />
          Nenhuma assinatura ativa. Escolha um plano abaixo.
        </div>
      )
    }
    if (subscription.status === 'PENDING') {
      return (
        <div className="flex items-center gap-3 text-amber-400 text-sm">
          <Clock size={16} />
          Pagamento pendente — finalize no Mercado Pago
          {subscription.checkoutUrl && (
            <a href={subscription.checkoutUrl} className="underline hover:text-amber-300 ml-1">
              Retomar checkout →
            </a>
          )}
        </div>
      )
    }
    if (subscription.status === 'ACTIVE') {
      return (
        <div className="flex items-center gap-3 text-emerald-400 text-sm">
          <CheckCircle2 size={16} />
          Assinatura ativa
          {subscription.currentPeriodEnd && (
            <span className="text-slate-400">
              · Próxima cobrança: {new Date(subscription.currentPeriodEnd).toLocaleDateString('pt-BR')}
            </span>
          )}
        </div>
      )
    }
    if (subscription.status === 'PAUSED') {
      return (
        <div className="flex items-center gap-3 text-yellow-400 text-sm">
          <AlertTriangle size={16} />
          Pagamento com problema — regularize para reativar o plano
        </div>
      )
    }
    return (
      <div className="flex items-center gap-3 text-red-400 text-sm">
        <XCircle size={16} />
        Assinatura cancelada. Escolha um plano abaixo para continuar.
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <CreditCard size={24} className="text-cyan-400" />
          Plano e Uso
        </h1>
        <p className="text-slate-400 mt-1">Gerencie seu plano e acompanhe o uso de recursos.</p>
      </div>

      {/* Bloco 1 — Plano atual + status assinatura */}
      <div className="bg-slate-900 border border-slate-700/50 rounded-2xl p-6 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-sm mb-1">Plano atual</p>
            <h2 className="text-white text-xl font-bold">
              {planInfo ? planInfo.name : 'Sem plano ativo'}
            </h2>
            {planInfo && (
              <p className="text-slate-400 text-sm mt-1">R${planInfo.price}/mês</p>
            )}
          </div>
          {planInfo && (
            <span className="bg-emerald-500/15 text-emerald-400 text-xs font-semibold px-3 py-1 rounded-full border border-emerald-500/30">
              Ativo
            </span>
          )}
        </div>
        <div className="pt-2 border-t border-slate-700/50">
          {subscriptionStatusBlock()}
        </div>
      </div>

      {/* Bloco 2 — Uso detalhado (só se tem plano ativo) */}
      {limits && (
        <div className="bg-slate-900 border border-slate-700/50 rounded-2xl p-6 space-y-5">
          <h3 className="text-white font-semibold">Uso detalhado</h3>

          <div className="space-y-1">
            <UsageBar
              label="Visitas este mês"
              current={usage.visitsThisMonth}
              limit={limits.visitsPerMonth}
            />
            {limits.visitsPerMonth && (
              <p className="text-slate-500 text-xs">Reinicia em {resetDate}</p>
            )}
            {showVisitWarning && (
              <div className="flex items-center gap-2 mt-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-3 py-2 text-yellow-400 text-xs">
                <AlertTriangle size={14} />
                {visitPct! >= 100
                  ? 'Limite de visitas atingido. Faça upgrade para continuar agendando.'
                  : `Você usou ${visitPct}% do limite de visitas. Considere fazer upgrade em breve.`}
              </div>
            )}
          </div>

          <div className="space-y-1">
            <UsageBar
              label="Usuários ativos"
              current={usage.activeUsers}
              limit={limits.users}
            />
            {showUserWarning && (
              <div className="flex items-center gap-2 mt-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-3 py-2 text-yellow-400 text-xs">
                <AlertTriangle size={14} />
                {userPct! >= 100
                  ? 'Limite de usuários atingido. Faça upgrade para adicionar mais.'
                  : `Você usou ${userPct}% do limite de usuários. Considere fazer upgrade em breve.`}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bloco 3 — Upgrade / escolha de plano */}
      <div className="space-y-4">
        <h3 className="text-white font-semibold">
          {planInfo ? 'Fazer upgrade' : 'Escolha um plano'}
        </h3>
        <PlanCards
          currentPlan={company?.plan ?? null}
          currentSubscription={
            subscription
              ? {
                  planKey: subscription.planKey,
                  status: subscription.status as 'PENDING' | 'ACTIVE' | 'PAUSED' | 'CANCELLED',
                  checkoutUrl: subscription.checkoutUrl,
                }
              : null
          }
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verificar build**

```bash
npm run build
```

Esperado: sem erros. Verificar também que `src/lib/constants.ts` não gera warning por importação não usada — se o `WHATSAPP_URL` não é mais importado em nenhum lugar, pode deixar o arquivo ou deletar.

- [ ] **Step 4: Testar fluxo completo manualmente**

```bash
npm run dev
```

1. Acessar `/dashboard/plano` com conta ADMIN cuja empresa tem `plan = null`
   → deve mostrar "Sem plano ativo", bloco de status "Nenhuma assinatura ativa", cartões com botão "Assinar"
2. Clicar "Assinar" em algum plano
   → deve redirecionar para checkout do MP (sandbox)
3. Voltar para `/dashboard/plano` (sem completar pagamento)
   → deve mostrar status "Pagamento pendente" com link "Retomar checkout"
4. Acessar `/dashboard/visitas` com `plan = null`
   → deve redirecionar para `/dashboard/plano`
5. Com conta cuja empresa tem `plan = 'enterprise'`
   → `/dashboard/visitas` deve abrir normalmente
   → `/dashboard/plano` deve mostrar "Premium" com status "Assinatura ativa"

- [ ] **Step 5: Commit**

```bash
git add src/components/plan-cards.tsx src/app/dashboard/plano/page.tsx
git commit -m "feat: billing UI — MP checkout buttons, subscription status on plan page"
```

---

### Task 7: Adicionar env vars ao Vercel e push final

**Files:** nenhum (configuração + git)

- [ ] **Step 1: Adicionar env vars no Vercel (Production)**

Vercel → Settings → Environment Variables → adicionar as três variáveis marcando apenas **Production**:

| Variável | Valor |
|---|---|
| `MP_ACCESS_TOKEN` | Token de produção do MP (`APP_USR-...`) ou sandbox para testes |
| `MP_WEBHOOK_SECRET` | Secret gerado na configuração do webhook no painel MP |
| `NEXT_PUBLIC_APP_URL` | `https://<seu-dominio>.vercel.app` |

- [ ] **Step 2: Configurar webhook URL no painel do Mercado Pago**

No painel MP → Seu negócio → Webhooks (ou Integrações):
- URL: `https://<seu-dominio>.vercel.app/api/webhooks/mercadopago`
- Eventos: `subscription_preapproval`
- Copiar o secret gerado para `MP_WEBHOOK_SECRET` no Vercel

- [ ] **Step 3: Push para GitHub**

```bash
git push origin master
```

Esperado: Vercel dispara deploy automático. Acompanhar build logs — deve passar sem erros.

- [ ] **Step 4: Smoke test em produção**

1. Logar como ADMIN de uma empresa com `plan = null`
2. Acessar `/dashboard/visitas` → deve redirecionar para `/dashboard/plano`
3. Em `/dashboard/plano`, clicar "Assinar" → deve redirecionar para MP checkout
4. Completar pagamento no sandbox do MP
5. Aguardar webhook (ou simular via curl para produção)
6. Verificar que `Company.plan` foi atualizado e `/dashboard/visitas` agora abre
