# Limites de Plano + Barra de Progresso — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enforce per-plan limits (visits/month and active users), show progress bars on dashboard and a dedicated plan page, block creation at the API level with an upgrade modal, and update landing page prices.

**Architecture:** A centralized helper (`src/lib/plan-limits.ts`) holds all plan constants and check functions. Server Components call `getUsage()` directly for rendering. Each POST API route calls the relevant check before creating records and returns a structured `LIMIT_REACHED` error. Client-side forms detect that error and open a `UpgradeModal` instead of showing an inline message.

**Tech Stack:** Next.js 16.2.2 App Router, Prisma 6, TypeScript, Tailwind CSS 4, next-auth v5 beta, lucide-react.

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/lib/plan-limits.ts` | **Create** | Plan constants, UTC month range, check functions, getUsage |
| `src/components/usage-bar.tsx` | **Create** | Reusable progress bar (cyan/yellow/red + unlimited state) |
| `src/components/upgrade-modal.tsx` | **Create** | Client modal shown when LIMIT_REACHED |
| `src/components/plan-cards.tsx` | **Modify** | New prices + optional `currentPlan` prop |
| `src/app/api/visitas/route.ts` | **Modify** | checkVisitLimit before POST create |
| `src/app/api/usuarios/route.ts` | **Modify** | checkUserLimit before POST create |
| `src/app/dashboard/page.tsx` | **Modify** | Usage widget below the 4 stat cards |
| `src/components/sidebar.tsx` | **Modify** | Add "Plano" item (ADMIN/SUPERADMIN only) |
| `src/app/dashboard/plano/page.tsx` | **Create** | Dedicated plan page (3 blocks) |
| `src/app/dashboard/visitas/page.tsx` | **Modify** | Disable "Agendar Visita" button when at limit |
| `src/app/dashboard/usuarios/page.tsx` | **Modify** | Disable "Novo Usuário" button when at limit |
| `src/app/dashboard/visitas/visit-form.tsx` | **Modify** | Open UpgradeModal on LIMIT_REACHED |
| `src/app/dashboard/usuarios/user-form.tsx` | **Modify** | Open UpgradeModal on LIMIT_REACHED |

---

## Task 1: `src/lib/plan-limits.ts` — Centralized plan helper

**Files:**
- Create: `src/lib/plan-limits.ts`

- [ ] **Step 1: Create the file**

```ts
import { prisma } from '@/lib/prisma'

export const PLAN_LIMITS: Record<string, { visitsPerMonth: number | null; users: number | null }> = {
  start:      { visitsPerMonth: 30,   users: 2    },
  pro:        { visitsPerMonth: 300,  users: 10   },
  enterprise: { visitsPerMonth: null, users: null },
}

function getMonthRangeUTC(): { gte: Date; lt: Date } {
  const now = new Date()
  const gte = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
  const lt  = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1))
  return { gte, lt }
}

async function getCompanyPlan(companyId: string): Promise<string> {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { plan: true },
  })
  if (!company) throw new Error(`Company not found: ${companyId}`)
  if (!PLAN_LIMITS[company.plan]) throw new Error(`Unknown plan: ${company.plan}`)
  return company.plan
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

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors related to `plan-limits.ts`.

- [ ] **Step 3: Commit**

```bash
git add src/lib/plan-limits.ts
git commit -m "feat: add plan-limits helper with check functions and getUsage"
```

---

## Task 2: `src/components/usage-bar.tsx` — Reusable progress bar

**Files:**
- Create: `src/components/usage-bar.tsx`

- [ ] **Step 1: Create the file**

```tsx
interface UsageBarProps {
  label: string
  current: number
  limit: number | null  // null = unlimited
}

export function UsageBar({ label, current, limit }: UsageBarProps) {
  if (limit === null) {
    return (
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">{label}</span>
          <span className="text-slate-300 font-medium">{current} (Ilimitado)</span>
        </div>
        <div className="h-2 rounded-full bg-slate-800" />
      </div>
    )
  }

  const percentage = limit === 0 ? 100 : Math.min(Math.round((current / limit) * 100), 100)

  const barColor =
    percentage >= 100 ? 'bg-red-500' :
    percentage >= 80  ? 'bg-yellow-400' :
    'bg-cyan-500'

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-400">{label}</span>
        <span className="text-slate-300 font-medium">
          {current} / {limit}
          <span className="text-slate-500 ml-2 text-xs">{percentage}%</span>
        </span>
      </div>
      <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/usage-bar.tsx
git commit -m "feat: add UsageBar component with cyan/yellow/red states and unlimited support"
```

---

## Task 3: `src/components/upgrade-modal.tsx` — Upgrade modal

**Files:**
- Create: `src/components/upgrade-modal.tsx`

- [ ] **Step 1: Create the file**

```tsx
'use client'

import { WHATSAPP_URL } from '@/lib/constants'

interface UpgradeModalProps {
  open: boolean
  onClose: () => void
  resource: 'visits' | 'users'
  limit: number
  current: number
}

const WA_MSG = encodeURIComponent('Olá! Atingi o limite do meu plano e gostaria de fazer upgrade.')

export function UpgradeModal({ open, onClose, resource, limit, current }: UpgradeModalProps) {
  if (!open) return null

  const resourceLabel = resource === 'visits' ? 'visitas' : 'usuários'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl">
        <h2 className="text-white font-bold text-lg mb-2">Limite atingido 🚫</h2>
        <p className="text-slate-400 text-sm mb-6">
          Você usou {current}/{limit} {resourceLabel} este mês. Faça upgrade para continuar.
        </p>
        <div className="flex flex-col gap-3">
          <a
            href={`${WHATSAPP_URL}?text=${WA_MSG}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-[#25d366] hover:bg-[#20bc5a] text-white font-semibold py-2.5 rounded-lg text-sm transition-colors"
          >
            💬 Fazer upgrade via WhatsApp
          </a>
          <button
            onClick={onClose}
            className="py-2.5 rounded-lg text-sm text-slate-400 hover:text-slate-200 border border-slate-700 hover:border-slate-600 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/upgrade-modal.tsx
git commit -m "feat: add UpgradeModal client component for plan limit enforcement"
```

---

## Task 4: `src/components/plan-cards.tsx` — Update prices and add `currentPlan` prop

**Files:**
- Modify: `src/components/plan-cards.tsx`

Current prices: R$50 / R$110 / R$250. New prices: R$49 / R$109 / R$249.
Current features for Básico: "Até 50 visitas/mês". New: "Até 30 visitas/mês".
New prop: `currentPlan?: string` — the card matching this key gets a "Seu plano atual" badge and disabled button.

- [ ] **Step 1: Replace the file content**

```tsx
'use client'

import Link from 'next/link'
import { WHATSAPP_URL } from '@/lib/constants'

interface Plan {
  key: string
  name: string
  price: string
  subtitle: string
  features: string[]
  popular?: boolean
  whatsappMsg: (name: string) => string
}

const PLANS: Plan[] = [
  {
    key: 'start',
    name: 'Básico',
    price: 'R$49',
    subtitle: 'Para começar',
    features: [
      'Até 2 usuários',
      'Até 30 visitas/mês',
      'Relatórios simples',
      'Assinatura básica',
    ],
    whatsappMsg: (name) =>
      `Olá! Me chamo ${name} e gostaria de assinar o plano Básico do Relatec (R$49/mês).`,
  },
  {
    key: 'pro',
    name: 'Profissional',
    price: 'R$109',
    subtitle: 'Para equipes',
    features: [
      'Até 10 usuários',
      'Até 300 visitas/mês',
      'Dashboard completo',
      'Filtros avançados',
    ],
    popular: true,
    whatsappMsg: (name) =>
      `Olá! Me chamo ${name} e gostaria de assinar o plano Profissional do Relatec (R$109/mês).`,
  },
  {
    key: 'enterprise',
    name: 'Premium',
    price: 'R$249',
    subtitle: 'White-label total',
    features: [
      'Usuários ilimitados',
      'Visitas ilimitadas',
      'White-label completo',
      'PDF profissional',
    ],
    whatsappMsg: (name) =>
      `Olá! Me chamo ${name} e gostaria de assinar o plano Premium do Relatec (R$249/mês).`,
  },
]

const WA_BASE = `${WHATSAPP_URL}?text=`

interface PlanCardsProps {
  userName: string | null
  currentPlan?: string
}

export function PlanCards({ userName, currentPlan }: PlanCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
      {PLANS.map((plan) => {
        const isCurrent = currentPlan === plan.key
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

            <p
              className={`text-xs uppercase tracking-widest mb-2 ${
                plan.popular ? 'text-cyan-500' : 'text-slate-400'
              }`}
            >
              {plan.name}
            </p>
            <p className="text-3xl font-extrabold text-slate-100 mb-1">
              {plan.price}
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
            ) : userName ? (
              <a
                href={`${WA_BASE}${encodeURIComponent(plan.whatsappMsg(userName))}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-center bg-[#25d366] hover:bg-[#20bc5a] text-white py-2.5 rounded-lg text-sm font-semibold transition-colors"
              >
                💬 Assinar pelo WhatsApp
              </a>
            ) : (
              <Link
                href="/cadastro"
                className={`block text-center py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                  plan.popular
                    ? 'bg-cyan-500 hover:bg-cyan-400 text-white'
                    : 'border border-cyan-500 text-cyan-500 hover:bg-cyan-500/10'
                }`}
              >
                Cadastrar grátis
              </Link>
            )}
          </div>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/plan-cards.tsx
git commit -m "feat: update plan prices (R\$49/R\$109/R\$249) and add currentPlan prop to PlanCards"
```

---

## Task 5: `src/app/api/visitas/route.ts` — Enforce visit limit

**Files:**
- Modify: `src/app/api/visitas/route.ts` (lines 29–54)

Add `checkVisitLimit` call after auth check, before the Prisma create.

- [ ] **Step 1: Add the import at the top of the file**

Replace:
```ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
```

With:
```ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { checkVisitLimit } from '@/lib/plan-limits'
```

- [ ] **Step 2: Add the limit check inside the POST handler, after the role check**

Replace:
```ts
  const body = await req.json()
  const parsed = createSchema.safeParse(body)
```

With:
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

  const body = await req.json()
  const parsed = createSchema.safeParse(body)
```

- [ ] **Step 3: Verify the full POST handler looks correct**

The POST handler after the change should be:
```ts
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  if (session.user.role === 'READER') {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

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

  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const { clientId, technicianId, scheduledAt, observations } = parsed.data

  const visit = await prisma.visit.create({
    data: {
      companyId:   session.user.companyId,
      clientId,
      technicianId,
      scheduledAt: new Date(scheduledAt),
      observations: observations || null,
    },
  })

  return NextResponse.json(visit, { status: 201 })
}
```

- [ ] **Step 4: Verify TypeScript**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/visitas/route.ts
git commit -m "feat: enforce visit limit in POST /api/visitas with structured LIMIT_REACHED error"
```

---

## Task 6: `src/app/api/usuarios/route.ts` — Enforce user limit

**Files:**
- Modify: `src/app/api/usuarios/route.ts` (lines 42–88)

Add `checkUserLimit` call inside the POST handler after the role check, before the email duplicate check.

- [ ] **Step 1: Add the import at the top of the file**

Replace:
```ts
import { NextResponse } from 'next/server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
```

With:
```ts
import { NextResponse } from 'next/server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { checkUserLimit } from '@/lib/plan-limits'
```

- [ ] **Step 2: Add the limit check after the role check in the POST handler**

Replace:
```ts
  const body = await request.json()
  const parsed = createUserSchema.safeParse(body)
```

With:
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

  const body = await request.json()
  const parsed = createUserSchema.safeParse(body)
```

- [ ] **Step 3: Verify the full POST handler looks correct**

```ts
export async function POST(request: Request) {
  const session = await auth()

  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPERADMIN') {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

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

  const body = await request.json()
  const parsed = createUserSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const { name, email, password, role } = parsed.data

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ error: 'E-mail já cadastrado' }, { status: 409 })
  }

  const hashedPassword = await bcrypt.hash(password, 12)

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role,
      companyId: session.user.companyId,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      active: true,
      createdAt: true,
    },
  })

  return NextResponse.json(user, { status: 201 })
}
```

- [ ] **Step 4: Verify TypeScript**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/usuarios/route.ts
git commit -m "feat: enforce user limit in POST /api/usuarios with structured LIMIT_REACHED error"
```

---

## Task 7: `src/app/dashboard/page.tsx` — Add usage widget

**Files:**
- Modify: `src/app/dashboard/page.tsx`

Add imports, fetch usage + plan after the existing data fetches, and render the widget below the "Status das Visitas" block.

- [ ] **Step 1: Add imports at the top of the file**

Replace:
```ts
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Users, Building2, ClipboardList, FileText, TrendingUp, CheckCircle2, Clock, XCircle } from 'lucide-react'
```

With:
```ts
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Users, Building2, ClipboardList, FileText, TrendingUp, CheckCircle2, Clock, XCircle } from 'lucide-react'
import { getUsage, PLAN_LIMITS } from '@/lib/plan-limits'
import { UsageBar } from '@/components/usage-bar'
```

- [ ] **Step 2: Add usage and plan data fetches after the existing Promise.all**

After:
```ts
  const visitasPorStatus = await prisma.visit.groupBy({
    by: ['status'],
    where: { companyId },
    _count: true,
  })

  const statusMap = Object.fromEntries(visitasPorStatus.map((v) => [v.status, v._count]))
```

Add:
```ts
  const [usage, companyData] = await Promise.all([
    getUsage(companyId),
    prisma.company.findUnique({ where: { id: companyId }, select: { plan: true, name: true } }),
  ])
  const limits = PLAN_LIMITS[companyData!.plan]

  const now = new Date()
  const nextMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1))
  const daysUntilReset = Math.ceil((nextMonth.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  const planNames: Record<string, string> = {
    start: 'Básico',
    pro: 'Profissional',
    enterprise: 'Premium',
  }
  const planName = planNames[companyData!.plan] ?? companyData!.plan
```

- [ ] **Step 3: Add the usage widget JSX at the end of the return, after the "Status das Visitas" block**

After the closing `</div>` of the "Status das Visitas" block and before the outer closing `</div>`:

```tsx
      {/* Uso do Plano */}
      <div className="bg-slate-900 border border-slate-700/50 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-white font-semibold">
            Uso do Plano — <span className="text-cyan-400">{planName}</span>
          </h3>
          <Link
            href="/dashboard/plano"
            className="text-sm text-slate-400 hover:text-cyan-400 transition-colors"
          >
            Ver detalhes →
          </Link>
        </div>
        <div className="space-y-4">
          <UsageBar
            label="Visitas este mês"
            current={usage.visitsThisMonth}
            limit={limits.visitsPerMonth}
          />
          <UsageBar
            label="Usuários ativos"
            current={usage.activeUsers}
            limit={limits.users}
          />
        </div>
        <p className="text-slate-500 text-xs mt-4">
          Reinicia em {daysUntilReset} dia{daysUntilReset !== 1 ? 's' : ''}
        </p>
      </div>
```

- [ ] **Step 4: Verify the full file structure is correct**

The return value should have this structure:
```tsx
  return (
    <div className="space-y-8">
      {/* Greeting */}
      ...
      {/* Cards principais */}
      ...
      {/* Status de Visitas */}
      ...
      {/* Uso do Plano */}   ← new block
      ...
    </div>
  )
```

- [ ] **Step 5: Verify TypeScript**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 6: Commit**

```bash
git add src/app/dashboard/page.tsx
git commit -m "feat: add plan usage widget to dashboard with progress bars and reset countdown"
```

---

## Task 8: `src/components/sidebar.tsx` — Add "Plano" nav item

**Files:**
- Modify: `src/components/sidebar.tsx`

The sidebar is a Client Component. It doesn't currently import `useSession`. Add the session hook and conditionally include the "Plano" item for ADMIN and SUPERADMIN.

- [ ] **Step 1: Add `useSession` import**

Replace:
```ts
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Building2,
  ClipboardList,
  FileText,
  ChevronLeft,
  ChevronRight,
  Zap,
} from 'lucide-react'
```

With:
```ts
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
  LayoutDashboard,
  Users,
  Building2,
  ClipboardList,
  FileText,
  ChevronLeft,
  ChevronRight,
  Zap,
  CreditCard,
} from 'lucide-react'
```

- [ ] **Step 2: Add "Plano" to the navItems array (at the end)**

Replace:
```ts
const navItems = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Usuários',
    href: '/dashboard/usuarios',
    icon: Users,
  },
  {
    label: 'Clientes',
    href: '/dashboard/clientes',
    icon: Building2,
  },
  {
    label: 'Visitas',
    href: '/dashboard/visitas',
    icon: ClipboardList,
  },
  {
    label: 'Relatórios',
    href: '/dashboard/relatorios',
    icon: FileText,
  },
]
```

With:
```ts
const navItems = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    adminOnly: false,
  },
  {
    label: 'Usuários',
    href: '/dashboard/usuarios',
    icon: Users,
    adminOnly: false,
  },
  {
    label: 'Clientes',
    href: '/dashboard/clientes',
    icon: Building2,
    adminOnly: false,
  },
  {
    label: 'Visitas',
    href: '/dashboard/visitas',
    icon: ClipboardList,
    adminOnly: false,
  },
  {
    label: 'Relatórios',
    href: '/dashboard/relatorios',
    icon: FileText,
    adminOnly: false,
  },
  {
    label: 'Plano',
    href: '/dashboard/plano',
    icon: CreditCard,
    adminOnly: true,
  },
]
```

- [ ] **Step 3: Add `useSession` call inside the `Sidebar` function and filter items**

Replace:
```ts
export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()
```

With:
```ts
export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()
  const { data: session } = useSession()
  const role = session?.user?.role
  const isAdminOrSuper = role === 'ADMIN' || role === 'SUPERADMIN'

  const visibleItems = navItems.filter((item) => !item.adminOnly || isAdminOrSuper)
```

- [ ] **Step 4: Update the nav render to use `visibleItems` instead of `navItems`**

Replace:
```tsx
        {navItems.map((item) => {
```

With:
```tsx
        {visibleItems.map((item) => {
```

- [ ] **Step 5: Verify TypeScript**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/sidebar.tsx
git commit -m "feat: add Plano nav item to sidebar (visible for ADMIN and SUPERADMIN only)"
```

---

## Task 9: `src/app/dashboard/plano/page.tsx` — Create dedicated plan page

**Files:**
- Create: `src/app/dashboard/plano/page.tsx`

This is a Server Component. Shows 3 blocks: current plan info, detailed usage with UsageBar, and upgrade options with PlanCards.

- [ ] **Step 1: Create the file**

```tsx
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getUsage, PLAN_LIMITS } from '@/lib/plan-limits'
import { UsageBar } from '@/components/usage-bar'
import { PlanCards } from '@/components/plan-cards'
import { CreditCard, AlertTriangle } from 'lucide-react'

export default async function PlanoPage() {
  const session = await auth()
  if (!session) redirect('/login')
  if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPERADMIN') {
    redirect('/dashboard')
  }

  const companyId = session.user.companyId

  const [usage, company] = await Promise.all([
    getUsage(companyId),
    prisma.company.findUnique({
      where: { id: companyId },
      select: { plan: true, name: true },
    }),
  ])

  const limits = PLAN_LIMITS[company!.plan]

  const planNames: Record<string, string> = {
    start: 'Básico',
    pro: 'Profissional',
    enterprise: 'Premium',
  }
  const planPrices: Record<string, string> = {
    start: 'R$49/mês',
    pro: 'R$109/mês',
    enterprise: 'R$249/mês',
  }
  const planName = planNames[company!.plan] ?? company!.plan
  const planPrice = planPrices[company!.plan] ?? ''

  const now = new Date()
  const nextMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1))
  const resetDate = nextMonth.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })

  const visitPct = limits.visitsPerMonth
    ? Math.round((usage.visitsThisMonth / limits.visitsPerMonth) * 100)
    : null
  const userPct = limits.users
    ? Math.round((usage.activeUsers / limits.users) * 100)
    : null
  const showVisitWarning = visitPct !== null && visitPct >= 80
  const showUserWarning = userPct !== null && userPct >= 80

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <CreditCard size={24} className="text-cyan-400" />
          Plano e Uso
        </h1>
        <p className="text-slate-400 mt-1">Gerencie seu plano e acompanhe o uso de recursos.</p>
      </div>

      {/* Bloco 1 — Plano atual */}
      <div className="bg-slate-900 border border-slate-700/50 rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-sm mb-1">Plano atual</p>
            <h2 className="text-white text-xl font-bold">{planName}</h2>
            <p className="text-slate-400 text-sm mt-1">{planPrice}</p>
          </div>
          <span className="bg-emerald-500/15 text-emerald-400 text-xs font-semibold px-3 py-1 rounded-full border border-emerald-500/30">
            Ativo
          </span>
        </div>
      </div>

      {/* Bloco 2 — Uso detalhado */}
      <div className="bg-slate-900 border border-slate-700/50 rounded-2xl p-6 space-y-5">
        <h3 className="text-white font-semibold">Uso detalhado</h3>

        <div className="space-y-1">
          <UsageBar
            label="Visitas este mês"
            current={usage.visitsThisMonth}
            limit={limits.visitsPerMonth}
          />
          {limits.visitsPerMonth && (
            <p className="text-slate-500 text-xs">
              Reinicia em {resetDate}
            </p>
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

      {/* Bloco 3 — Upgrade */}
      <div className="space-y-4">
        <h3 className="text-white font-semibold">Fazer upgrade</h3>
        <PlanCards userName={session.user.name ?? null} currentPlan={company!.plan} />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/dashboard/plano/page.tsx
git commit -m "feat: add /dashboard/plano page with plan info, usage bars, and upgrade options"
```

---

## Task 10: `src/app/dashboard/visitas/page.tsx` — Disable button at limit

**Files:**
- Modify: `src/app/dashboard/visitas/page.tsx`

Add `checkVisitLimit` call and conditionally render a disabled button instead of the Link when at limit.

- [ ] **Step 1: Add the import**

Replace:
```ts
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { VisitCard } from './visit-card'
import { Plus, CalendarX } from 'lucide-react'
```

With:
```ts
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { VisitCard } from './visit-card'
import { Plus, CalendarX } from 'lucide-react'
import { checkVisitLimit } from '@/lib/plan-limits'
```

- [ ] **Step 2: Add the limit check after auth, before the data fetches**

Replace:
```ts
  const { status, clientId, technicianId } = searchParams

  const [visits, clients, technicians] = await Promise.all([
```

With:
```ts
  const { status, clientId, technicianId } = searchParams

  const [visitCheck, visits, clients, technicians] = await Promise.all([
    checkVisitLimit(session.user.companyId),
```

And close with the existing array entries — the full Promise.all becomes:
```ts
  const [visitCheck, visits, clients, technicians] = await Promise.all([
    checkVisitLimit(session.user.companyId),
    prisma.visit.findMany({
      where: {
        companyId: session.user.companyId,
        ...(status       && { status: status as any }),
        ...(clientId     && { clientId }),
        ...(technicianId && { technicianId }),
      },
      include: {
        client:     { select: { id: true, name: true, address: true, city: true, state: true } },
        technician: { select: { id: true, name: true } },
      },
      orderBy: { scheduledAt: 'asc' },
    }),
    prisma.client.findMany({
      where:   { companyId: session.user.companyId, active: true },
      select:  { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
    prisma.user.findMany({
      where:   { companyId: session.user.companyId, active: true, role: { not: 'READER' } },
      select:  { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ])
```

- [ ] **Step 3: Add `atLimit` variable and update the canCreate check**

After the Promise.all, replace:
```ts
  const canCreate = session.user.role !== 'READER'
  const hasFilters = status || clientId || technicianId
```

With:
```ts
  const canCreate = session.user.role !== 'READER'
  const atLimit = !visitCheck.allowed
  const hasFilters = status || clientId || technicianId
```

- [ ] **Step 4: Replace the "Agendar Visita" Link in the header with a conditional**

Replace:
```tsx
        {canCreate && (
          <Link
            href="/dashboard/visitas/novo"
            className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-semibold px-4 py-2.5 rounded-lg text-sm transition-colors"
          >
            <Plus size={16} /> Agendar Visita
          </Link>
        )}
```

With:
```tsx
        {canCreate && (
          atLimit ? (
            <button
              disabled
              title="Limite do plano atingido"
              className="flex items-center gap-2 bg-slate-700 text-slate-500 font-semibold px-4 py-2.5 rounded-lg text-sm cursor-not-allowed"
            >
              <Plus size={16} /> Agendar Visita
            </button>
          ) : (
            <Link
              href="/dashboard/visitas/novo"
              className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-semibold px-4 py-2.5 rounded-lg text-sm transition-colors"
            >
              <Plus size={16} /> Agendar Visita
            </Link>
          )
        )}
```

- [ ] **Step 5: Replace the empty-state "Agendar primeira visita" Link with a conditional**

Replace:
```tsx
          {canCreate && !hasFilters && (
            <Link
              href="/dashboard/visitas/novo"
              className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors"
            >
              <Plus size={15} /> Agendar primeira visita
            </Link>
          )}
```

With:
```tsx
          {canCreate && !hasFilters && !atLimit && (
            <Link
              href="/dashboard/visitas/novo"
              className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors"
            >
              <Plus size={15} /> Agendar primeira visita
            </Link>
          )}
```

- [ ] **Step 6: Verify TypeScript**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 7: Commit**

```bash
git add src/app/dashboard/visitas/page.tsx
git commit -m "feat: disable Agendar Visita button when monthly visit limit is reached"
```

---

## Task 11: `src/app/dashboard/usuarios/page.tsx` — Disable button at limit

**Files:**
- Modify: `src/app/dashboard/usuarios/page.tsx`

Add `checkUserLimit` call and conditionally render a disabled button instead of the Link when at limit.

- [ ] **Step 1: Add the import**

Replace:
```ts

import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { UserCard } from './user-card'
import { Plus, Users } from 'lucide-react'
```

With:
```ts
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { UserCard } from './user-card'
import { Plus, Users } from 'lucide-react'
import { checkUserLimit } from '@/lib/plan-limits'
```

- [ ] **Step 2: Add the limit check before the user fetch**

Replace:
```ts
  const users = await prisma.user.findMany({
```

With:
```ts
  const [userCheck, users] = await Promise.all([
    checkUserLimit(session.user.companyId),
    prisma.user.findMany({
```

And close the Promise.all after the `orderBy` — the full block becomes:
```ts
  const [userCheck, users] = await Promise.all([
    checkUserLimit(session.user.companyId),
    prisma.user.findMany({
      where: { companyId: session.user.companyId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
  ])
```

- [ ] **Step 3: Add `atLimit` variable after the Promise.all**

After the Promise.all and before `roleCount`, add:
```ts
  const atLimit = !userCheck.allowed
```

- [ ] **Step 4: Replace the "Novo Usuário" Link in the header with a conditional**

Replace:
```tsx
        <Link
          href="/dashboard/usuarios/novo"
          className="flex items-center gap-2 px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-semibold rounded-xl transition-colors text-sm"
        >
          <Plus size={16} />
          Novo Usuário
        </Link>
```

With:
```tsx
        {atLimit ? (
          <button
            disabled
            title="Limite do plano atingido"
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-700 text-slate-500 font-semibold rounded-xl cursor-not-allowed text-sm"
          >
            <Plus size={16} />
            Novo Usuário
          </button>
        ) : (
          <Link
            href="/dashboard/usuarios/novo"
            className="flex items-center gap-2 px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-semibold rounded-xl transition-colors text-sm"
          >
            <Plus size={16} />
            Novo Usuário
          </Link>
        )}
```

- [ ] **Step 5: Verify TypeScript**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 6: Commit**

```bash
git add src/app/dashboard/usuarios/page.tsx
git commit -m "feat: disable Novo Usuário button when user limit is reached"
```

---

## Task 12: `src/app/dashboard/visitas/visit-form.tsx` — Integrate UpgradeModal

**Files:**
- Modify: `src/app/dashboard/visitas/visit-form.tsx`

When the API returns `{ error: 'LIMIT_REACHED' }`, open the UpgradeModal instead of setting the inline error string.

- [ ] **Step 1: Add the import**

Replace:
```ts
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MapPin } from 'lucide-react'
```

With:
```ts
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MapPin } from 'lucide-react'
import { UpgradeModal } from '@/components/upgrade-modal'
```

- [ ] **Step 2: Add modal state variables after the existing `loading` state**

Replace:
```ts
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)
```

With:
```ts
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)
  const [upgradeModal, setUpgradeModal] = useState<{
    open: boolean; limit: number; current: number
  }>({ open: false, limit: 0, current: 0 })
```

- [ ] **Step 3: Update handleSubmit to detect LIMIT_REACHED**

Replace the error-handling block in handleSubmit:
```ts
    if (!res.ok) {
      setError(data.error || 'Erro ao salvar')
      return
    }
```

With:
```ts
    if (!res.ok) {
      if (data.error === 'LIMIT_REACHED') {
        setUpgradeModal({ open: true, limit: data.limit, current: data.current })
      } else {
        setError(data.error || 'Erro ao salvar')
      }
      return
    }
```

- [ ] **Step 4: Add the UpgradeModal to the JSX, just before the `</div>` that closes the form card**

Add just before the closing `</div>` of the outer `<div className="max-w-2xl">`:

```tsx
      <UpgradeModal
        open={upgradeModal.open}
        onClose={() => setUpgradeModal((m) => ({ ...m, open: false }))}
        resource="visits"
        limit={upgradeModal.limit}
        current={upgradeModal.current}
      />
```

The full return should now end with:
```tsx
  return (
    <div className="max-w-2xl">
      {/* Card container */}
      <div className="bg-slate-900 border border-slate-700/50 rounded-2xl p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          ...existing form content...
        </form>
      </div>
      <UpgradeModal
        open={upgradeModal.open}
        onClose={() => setUpgradeModal((m) => ({ ...m, open: false }))}
        resource="visits"
        limit={upgradeModal.limit}
        current={upgradeModal.current}
      />
    </div>
  )
```

- [ ] **Step 5: Verify TypeScript**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 6: Commit**

```bash
git add src/app/dashboard/visitas/visit-form.tsx
git commit -m "feat: open UpgradeModal instead of inline error when visit limit is reached"
```

---

## Task 13: `src/app/dashboard/usuarios/user-form.tsx` — Integrate UpgradeModal

**Files:**
- Modify: `src/app/dashboard/usuarios/user-form.tsx`

When the API returns `{ error: 'LIMIT_REACHED' }`, open the UpgradeModal instead of setting the inline error string.

- [ ] **Step 1: Add the import**

Replace:
```ts
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Save, Loader2, Eye, EyeOff } from 'lucide-react'
```

With:
```ts
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Save, Loader2, Eye, EyeOff } from 'lucide-react'
import { UpgradeModal } from '@/components/upgrade-modal'
```

- [ ] **Step 2: Add modal state variables after the existing `showPassword` state**

Replace:
```ts
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
```

With:
```ts
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [upgradeModal, setUpgradeModal] = useState<{
    open: boolean; limit: number; current: number
  }>({ open: false, limit: 0, current: 0 })
```

- [ ] **Step 3: Update handleSubmit to detect LIMIT_REACHED**

Replace:
```ts
    if (res.ok) {
      router.push('/dashboard/usuarios')
      router.refresh()
    } else {
      const data = await res.json()
      setError(data.error ?? 'Erro ao salvar usuário')
    }
```

With:
```ts
    if (res.ok) {
      router.push('/dashboard/usuarios')
      router.refresh()
    } else {
      const data = await res.json()
      if (data.error === 'LIMIT_REACHED') {
        setUpgradeModal({ open: true, limit: data.limit, current: data.current })
      } else {
        setError(data.error ?? 'Erro ao salvar usuário')
      }
    }
```

- [ ] **Step 4: Add the UpgradeModal to the JSX, after the closing `</form>` tag**

The `UserForm` currently returns a `<form>` directly. Wrap the return to add the modal. Replace:
```tsx
  return (
    <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-700/50 rounded-2xl p-6 space-y-5 max-w-lg">
      ...
    </form>
  )
```

With:
```tsx
  return (
    <>
      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-700/50 rounded-2xl p-6 space-y-5 max-w-lg">
        ...existing form content (unchanged)...
      </form>
      <UpgradeModal
        open={upgradeModal.open}
        onClose={() => setUpgradeModal((m) => ({ ...m, open: false }))}
        resource="users"
        limit={upgradeModal.limit}
        current={upgradeModal.current}
      />
    </>
  )
```

- [ ] **Step 5: Verify TypeScript**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 6: Final build verification**

Run: `npm run build`
Expected: Build succeeds with no TypeScript or compilation errors.

- [ ] **Step 7: Commit**

```bash
git add src/app/dashboard/usuarios/user-form.tsx
git commit -m "feat: open UpgradeModal instead of inline error when user limit is reached"
```

---

## Final Notes

- **No automated test suite** in this project. Verification is via `npx tsc --noEmit` after each task and `npm run build` at the end.
- **Race condition** between count and create is accepted as a known trade-off (documented in spec).
- **SUPERADMIN** is not affected by plan limits (they don't belong to a company with a plan in the normal sense), but the helpers will throw if `companyId` is invalid — SUPERADMIN pages that call these should guard accordingly.
- **Storage limits** are explicitly out of scope for this plan — the helper is structured to add them later without rewriting.
