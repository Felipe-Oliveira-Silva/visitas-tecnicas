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

  const limits = PLAN_LIMITS[company!.plan as 'start' | 'pro' | 'enterprise']

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
