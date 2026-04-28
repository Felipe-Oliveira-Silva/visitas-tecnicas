
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Users, Building2, ClipboardList, FileText, TrendingUp, CheckCircle2, Clock, XCircle } from 'lucide-react'
import { getUsage, PLAN_LIMITS } from '@/lib/plan-limits'
import { PlanKey } from '@/lib/billing'
import { UsageBar } from '@/components/usage-bar'
import { AlertTriangle } from 'lucide-react'

export default async function DashboardPage() {
  const session = await auth()
  const companyId = session!.user.companyId

  const [totalUsuarios, totalClientes, totalVisitas, totalRelatorios] = await Promise.all([
    prisma.user.count({ where: { companyId } }),
    prisma.client.count({ where: { companyId } }),
    prisma.visit.count({ where: { companyId } }),
    prisma.report.count({ where: { companyId } }),
  ])

  const visitasPorStatus = await prisma.visit.groupBy({
    by: ['status'],
    where: { companyId },
    _count: true,
  })

  const statusMap = Object.fromEntries(visitasPorStatus.map((v) => [v.status, v._count]))

  const [usage, companyData] = await Promise.all([
    getUsage(companyId),
    prisma.company.findUnique({ where: { id: companyId }, select: { plan: true, name: true } }),
  ])
  const limits = PLAN_LIMITS[(companyData!.plan ?? 'start') as PlanKey]

  const now = new Date()
  const nextMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1))
  const daysUntilReset = Math.max(1, Math.ceil((nextMonth.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))

  const planNames: Record<string, string> = {
    start: 'Básico',
    pro: 'Profissional',
    enterprise: 'Premium',
  }
  const planName = planNames[companyData!.plan!] ?? companyData!.plan!
  const userPct = limits.users
    ? Math.round((usage.activeUsers / limits.users) * 100)
    : null
  const cards = [
    {
      label: 'Usuários',
      value: totalUsuarios,
      icon: Users,
      color: 'from-cyan-500 to-blue-600',
      shadow: 'shadow-cyan-500/20',
      bg: 'bg-cyan-500/10',
      text: 'text-cyan-400',
    },
    {
      label: 'Clientes',
      value: totalClientes,
      icon: Building2,
      color: 'from-violet-500 to-purple-600',
      shadow: 'shadow-violet-500/20',
      bg: 'bg-violet-500/10',
      text: 'text-violet-400',
    },
    {
      label: 'Visitas',
      value: totalVisitas,
      icon: ClipboardList,
      color: 'from-amber-500 to-orange-600',
      shadow: 'shadow-amber-500/20',
      bg: 'bg-amber-500/10',
      text: 'text-amber-400',
    },
    {
      label: 'Relatórios',
      value: totalRelatorios,
      icon: FileText,
      color: 'from-emerald-500 to-green-600',
      shadow: 'shadow-emerald-500/20',
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-400',
    },
  ]

  const visitaStats = [
    { label: 'Realizadas', value: statusMap['REALIZED'] ?? 0, icon: CheckCircle2, color: 'text-emerald-400' },
    { label: 'Agendadas', value: statusMap['SCHEDULED'] ?? 0, icon: Clock, color: 'text-amber-400' },
    { label: 'Não Realizadas', value: statusMap['NOT_REALIZED'] ?? 0, icon: XCircle, color: 'text-red-400' },
  ]

  const hora = new Date().getHours()
  const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite'

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <div>
        <h2 className="text-2xl font-bold text-white">
          {saudacao}, {session?.user?.name?.split(' ')[0]} 👋
        </h2>
        <p className="text-slate-400 mt-1">Aqui está um resumo do que está acontecendo na sua conta.</p>
      </div>

      {/* Cards principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <div
              key={card.label}
              className="bg-slate-900 border border-slate-700/50 rounded-2xl p-5 flex items-center gap-4 hover:border-slate-600 transition-colors"
            >
              <div className={`w-12 h-12 rounded-xl ${card.bg} flex items-center justify-center flex-shrink-0`}>
                <Icon size={22} className={card.text} />
              </div>
              <div>
                <p className="text-slate-400 text-sm">{card.label}</p>
                <p className="text-white text-2xl font-bold leading-none mt-0.5">{card.value}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Status de Visitas */}
      <div className="bg-slate-900 border border-slate-700/50 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-5">
          <TrendingUp size={18} className="text-cyan-400" />
          <h3 className="text-white font-semibold">Status das Visitas</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {visitaStats.map((stat) => {
            const Icon = stat.icon
            return (
              <div key={stat.label} className="bg-slate-800/50 rounded-xl p-4 flex items-center gap-3">
                <Icon size={20} className={stat.color} />
                <div>
                  <p className="text-slate-400 text-xs">{stat.label}</p>
                  <p className="text-white font-bold text-xl leading-none mt-0.5">{stat.value}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Uso do Plano — oculto para planos sem limites (enterprise) */}
      {(limits.visitsPerMonth !== null || limits.users !== null) && (
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
            {userPct !== null && (
              <div className="flex items-center gap-2 mt-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-3 py-2 text-yellow-400 text-xs">
                <AlertTriangle size={14} />
                {userPct >= 100
                  ? 'Limite de usuários atingido. Faça upgrade para adicionar mais.'
                  : `Você usou ${userPct}% do limite de usuários. Considere fazer upgrade em breve.`}
              </div>
            )}
          </div>
          <p className="text-slate-500 text-xs mt-4">
            Reinicia em {daysUntilReset} dia{daysUntilReset !== 1 ? 's' : ''}
          </p>
        </div>
      )}
    </div>
  )
}
