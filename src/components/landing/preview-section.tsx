import { type ReactNode } from 'react'
import {
  Calendar,
  Camera,
  CheckCircle2,
  FileText,
  TrendingUp,
  TrendingDown,
  Plus,
  ChevronDown,
} from 'lucide-react'
import { Reveal } from './reveal'

interface MockupFrameProps {
  title: string
  children: ReactNode
}

function MockupFrame({ title, children }: MockupFrameProps) {
  return (
    <div className="relative">
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 pointer-events-none"
        style={{
          background:
            'radial-gradient(60% 60% at 50% 50%, rgba(34, 211, 238, 0.18), transparent 70%)',
          filter: 'blur(48px)',
        }}
      />
      <div className="relative rounded-2xl border border-white/10 bg-slate-900/70 backdrop-blur-xl shadow-2xl shadow-cyan-500/10 overflow-hidden">
        <div className="flex items-center gap-1.5 px-4 py-3 border-b border-white/5 bg-white/[0.02]">
          <span
            aria-hidden="true"
            className="w-2.5 h-2.5 rounded-full bg-rose-400/60"
          />
          <span
            aria-hidden="true"
            className="w-2.5 h-2.5 rounded-full bg-amber-300/60"
          />
          <span
            aria-hidden="true"
            className="w-2.5 h-2.5 rounded-full bg-emerald-400/60"
          />
          <span className="ml-4 text-[11px] text-slate-500 font-mono truncate">
            {title}
          </span>
        </div>
        {children}
      </div>
    </div>
  )
}

const KPI_TONES = {
  cyan: 'text-cyan-300 bg-cyan-500/10 ring-cyan-400/30',
  amber: 'text-amber-300 bg-amber-500/10 ring-amber-400/30',
  emerald: 'text-emerald-300 bg-emerald-500/10 ring-emerald-400/30',
} as const

interface KpiCardProps {
  label: string
  value: string
  trend: string
  tone: keyof typeof KPI_TONES
  positive: boolean
}

function KpiCard({ label, value, trend, tone, positive }: KpiCardProps) {
  const TrendIcon = positive ? TrendingUp : TrendingDown
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 sm:p-4">
      <p className="text-[10px] uppercase tracking-wider text-slate-500 font-medium truncate">
        {label}
      </p>
      <div className="mt-1.5 flex items-baseline justify-between gap-2">
        <p className="text-2xl sm:text-3xl font-bold text-slate-100 leading-none">
          {value}
        </p>
        <span
          className={`shrink-0 inline-flex items-center gap-1 rounded-full ring-1 px-2 py-0.5 text-[10px] font-semibold ${KPI_TONES[tone]}`}
        >
          <TrendIcon size={10} aria-hidden="true" />
          {trend}
        </span>
      </div>
    </div>
  )
}

const VISITS = [
  {
    initials: 'MP',
    client: 'Edifício Marina Plaza',
    service: 'Manutenção elétrica',
    when: 'Hoje · 09:30',
    status: 'Realizada',
    tone: 'emerald',
    gradient: 'from-cyan-400/40 to-blue-600/40',
  },
  {
    initials: 'LC',
    client: 'Lemos & Cia',
    service: 'Climatização',
    when: 'Ontem · 14:00',
    status: 'Em andamento',
    tone: 'amber',
    gradient: 'from-amber-400/40 to-rose-500/40',
  },
  {
    initials: 'BM',
    client: 'Casa Beira Mar',
    service: 'Energia solar',
    when: '11/05 · 10:15',
    status: 'Realizada',
    tone: 'emerald',
    gradient: 'from-emerald-400/40 to-teal-600/40',
  },
] as const

const STATUS_PILL = {
  emerald: 'bg-emerald-500/10 border-emerald-400/30 text-emerald-300',
  amber: 'bg-amber-500/10 border-amber-400/30 text-amber-300',
} as const

function DashboardMockup() {
  return (
    <MockupFrame title="relatec.app · painel">
      <div className="px-5 py-4 flex items-center justify-between border-b border-white/5">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-cyan-400 font-semibold">
            Painel mensal
          </p>
          <p className="mt-1 text-sm sm:text-base font-semibold text-slate-100">
            Maio · 2026
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.03] text-xs text-slate-300 px-2.5 py-1.5">
          <Calendar size={12} className="text-slate-400" aria-hidden="true" />
          Este mês
          <ChevronDown size={12} className="text-slate-500" aria-hidden="true" />
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2.5 sm:gap-3 px-5 py-4">
        <KpiCard
          label="Visitas realizadas"
          value="48"
          trend="+12%"
          tone="cyan"
          positive
        />
        <KpiCard
          label="Pendentes"
          value="6"
          trend="-2"
          tone="amber"
          positive={false}
        />
        <KpiCard
          label="Clientes atendidos"
          value="31"
          trend="+4"
          tone="emerald"
          positive
        />
      </div>

      <div className="px-5 pb-5">
        <div className="flex items-center justify-between mb-2.5">
          <p className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">
            Visitas recentes
          </p>
          <span className="text-[10px] text-cyan-300 font-semibold">
            Ver todas
          </span>
        </div>
        <ul className="rounded-xl border border-white/10 bg-white/[0.02] divide-y divide-white/5 overflow-hidden">
          {VISITS.map((v) => (
            <li
              key={v.client}
              className="flex items-center gap-3 px-3.5 py-2.5"
            >
              <span
                aria-hidden="true"
                className={`shrink-0 grid place-items-center w-8 h-8 rounded-lg bg-gradient-to-br ${v.gradient} ring-1 ring-white/10 text-[10px] font-bold text-slate-100`}
              >
                {v.initials}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-100 truncate">
                  {v.client}
                </p>
                <p className="text-[10px] text-slate-400 truncate">
                  {v.service} · {v.when}
                </p>
              </div>
              <span
                className={`shrink-0 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${
                  STATUS_PILL[v.tone]
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`w-1.5 h-1.5 rounded-full ${
                    v.tone === 'emerald' ? 'bg-emerald-400' : 'bg-amber-400'
                  }`}
                />
                {v.status}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </MockupFrame>
  )
}

function ReportMockup() {
  return (
    <MockupFrame title="relatec.app · relatórios · #1234">
      <div className="px-5 py-4 border-b border-white/5">
        <p className="text-[10px] uppercase tracking-widest text-cyan-400 font-semibold">
          Relatório técnico
        </p>
        <p className="mt-1.5 text-sm font-semibold text-slate-100">
          Centro Médico Atlas
        </p>
        <p className="text-xs text-slate-400">
          Manutenção elétrica · 12/05/2026
        </p>
      </div>

      <div className="px-5 py-2.5 flex items-center justify-between border-b border-white/5">
        <span className="text-[10px] uppercase tracking-wider text-slate-500">
          Status
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-400/30 text-[10px] font-medium text-emerald-300 px-2.5 py-1">
          <CheckCircle2 size={10} aria-hidden="true" />
          Concluído e assinado
        </span>
      </div>

      <div className="px-5 py-4 border-b border-white/5">
        <div className="flex items-center gap-2 mb-2.5">
          <Camera size={12} className="text-slate-500" aria-hidden="true" />
          <span className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">
            4 fotos do serviço
          </span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          <div
            aria-hidden="true"
            className="aspect-square rounded-lg bg-gradient-to-br from-cyan-500/40 to-blue-700/30 ring-1 ring-white/10"
          />
          <div
            aria-hidden="true"
            className="aspect-square rounded-lg bg-gradient-to-br from-amber-500/40 to-rose-600/30 ring-1 ring-white/10"
          />
          <div
            aria-hidden="true"
            className="aspect-square rounded-lg bg-gradient-to-br from-slate-400/40 to-slate-700/30 ring-1 ring-white/10"
          />
          <div
            aria-hidden="true"
            className="aspect-square rounded-lg bg-gradient-to-br from-emerald-500/40 to-teal-700/30 ring-1 ring-white/10"
          />
        </div>
      </div>

      <div className="px-5 py-3 border-b border-white/5">
        <p className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">
          Observações
        </p>
        <p className="mt-1.5 text-xs text-slate-300 leading-relaxed">
          Trocados 3 disjuntores no quadro principal. Realizado teste de carga.
          Sistema funcionando normalmente.
        </p>
      </div>

      <div className="px-5 py-4">
        <p className="text-[10px] uppercase tracking-wider text-slate-500 font-medium mb-2">
          Assinatura do cliente
        </p>
        <div className="rounded-lg border border-white/10 bg-white/[0.02] h-16 flex items-center px-4">
          <svg
            viewBox="0 0 220 40"
            className="h-9 w-full text-cyan-300"
            aria-hidden="true"
          >
            <path
              d="M 8 26 C 14 8, 26 32, 36 18 S 52 4, 64 24 Q 74 32, 84 16 T 116 22 C 126 28, 136 6, 148 24 S 168 26, 184 14 Q 196 8, 212 22"
              stroke="currentColor"
              fill="none"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <p className="mt-2 text-[10px] text-slate-500">
          Maria Eduarda Pires · 12/05/2026 às 14:42
        </p>
      </div>
    </MockupFrame>
  )
}

const BUDGET_ITEMS = [
  { name: 'Manutenção preventiva', qty: '1 visita', value: 'R$ 480,00' },
  { name: 'Substituição de filtro', qty: '2 un', value: 'R$ 240,00' },
  { name: 'Carga de gás refrigerante', qty: '1 kg', value: 'R$ 180,00' },
  { name: 'Mão de obra adicional', qty: '2 h', value: 'R$ 160,00' },
] as const

function BudgetMockup() {
  return (
    <MockupFrame title="relatec.app · orçamentos · #87">
      <div className="px-5 py-4 border-b border-white/5 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-widest text-amber-400 font-semibold">
            Orçamento
          </p>
          <p className="mt-1.5 text-sm font-semibold text-slate-100 truncate">
            Climatização Sala 304
          </p>
          <p className="text-xs text-slate-400 truncate">
            Cliente: Lemos & Cia
          </p>
        </div>
        <span className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-400/30 text-[10px] font-medium text-amber-300 px-2.5 py-1">
          <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          Enviado ao cliente
        </span>
      </div>

      <div className="px-5 py-3 border-b border-white/5">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">
            Itens
          </p>
          <span className="inline-flex items-center gap-1 text-[10px] text-slate-500">
            <Plus size={10} aria-hidden="true" />
            adicionar
          </span>
        </div>
        <ul className="rounded-xl border border-white/10 bg-white/[0.02] divide-y divide-white/5">
          {BUDGET_ITEMS.map((item) => (
            <li
              key={item.name}
              className="flex items-center justify-between gap-3 px-3.5 py-2.5"
            >
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-100 truncate">
                  {item.name}
                </p>
                <p className="text-[10px] text-slate-500">{item.qty}</p>
              </div>
              <p className="shrink-0 text-xs font-semibold text-slate-200 tabular-nums">
                {item.value}
              </p>
            </li>
          ))}
        </ul>
      </div>

      <div className="px-5 py-3 border-b border-white/5">
        <div className="flex justify-between text-xs text-slate-400">
          <span>Subtotal</span>
          <span className="tabular-nums">R$ 1.060,00</span>
        </div>
        <div className="mt-1 flex justify-between text-xs text-slate-400">
          <span>Impostos</span>
          <span className="tabular-nums">R$ 0,00</span>
        </div>
        <div className="mt-2.5 pt-2.5 border-t border-white/5 flex items-baseline justify-between">
          <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
            Total
          </span>
          <span className="text-lg font-bold tabular-nums bg-gradient-to-r from-amber-200 to-amber-400 bg-clip-text text-transparent">
            R$ 1.060,00
          </span>
        </div>
      </div>

      <div className="px-5 py-3 flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2 text-xs text-slate-300 min-w-0">
          <span className="grid place-items-center w-7 h-7 rounded-lg bg-cyan-500/10 ring-1 ring-cyan-400/20 shrink-0">
            <FileText size={12} className="text-cyan-300" aria-hidden="true" />
          </span>
          <span className="truncate">PDF pronto para envio</span>
        </span>
        <span className="shrink-0 inline-flex items-center gap-1 text-[11px] font-semibold text-cyan-300">
          Baixar
        </span>
      </div>
    </MockupFrame>
  )
}

export function PreviewSection() {
  return (
    <section className="relative py-20 md:py-28 border-b border-slate-800">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center max-w-2xl mx-auto">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/5 px-3 py-1 text-[11px] uppercase tracking-widest text-cyan-300 font-semibold">
              Preview
            </span>
          </Reveal>
          <Reveal delay={80}>
            <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-bold text-balance text-slate-100 leading-tight">
              Veja o Relatec{' '}
              <span className="bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text text-transparent">
                em ação
              </span>
            </h2>
          </Reveal>
          <Reveal delay={160}>
            <p className="mt-4 text-base sm:text-lg text-slate-400 max-w-xl mx-auto leading-relaxed">
              Uma visão simples de como sua equipe registra visitas, acompanha
              relatórios, cria orçamentos e entrega documentos profissionais.
            </p>
          </Reveal>
        </div>

        <div className="mt-10 md:mt-14 grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
          <Reveal className="lg:col-span-2">
            <DashboardMockup />
          </Reveal>
          <Reveal delay={120}>
            <ReportMockup />
          </Reveal>
          <Reveal delay={220}>
            <BudgetMockup />
          </Reveal>
        </div>
      </div>
    </section>
  )
}
