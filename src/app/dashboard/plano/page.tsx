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
          {planInfo && subscription?.status === 'ACTIVE' && (
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
