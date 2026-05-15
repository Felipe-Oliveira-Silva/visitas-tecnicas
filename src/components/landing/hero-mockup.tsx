import { Camera, CheckCircle2, FileText, PenLine } from 'lucide-react'

export function HeroMockup() {
  return (
    <div className="relative mx-auto w-full max-w-md lg:max-w-none">
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 pointer-events-none"
        style={{
          background:
            'radial-gradient(60% 60% at 50% 50%, rgba(34, 211, 238, 0.28), transparent 70%)',
          filter: 'blur(40px)',
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
            relatec.app · visita #4821
          </span>
        </div>

        <div className="px-5 py-4 border-b border-white/5 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-widest text-cyan-400 font-semibold">
              Visita técnica
            </p>
            <p className="mt-1.5 text-sm font-semibold text-slate-100 truncate">
              Edifício Marina Plaza
            </p>
            <p className="mt-0.5 text-xs text-slate-400 truncate">
              Manutenção elétrica · 14/05 · 09:30
            </p>
          </div>
          <span className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-400/30 px-2.5 py-1 text-[10px] font-medium text-emerald-300">
            <span
              aria-hidden="true"
              className="w-1.5 h-1.5 rounded-full bg-emerald-400"
            />
            Realizada
          </span>
        </div>

        <div className="px-5 py-4">
          <div className="flex items-center gap-2 mb-2.5">
            <Camera
              size={12}
              className="text-slate-500"
              aria-hidden="true"
            />
            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">
              4 fotos anexadas
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

        <div className="px-5 py-4 border-t border-white/5 flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 rounded-md bg-gradient-to-r from-cyan-400 to-blue-500 text-white text-xs font-semibold px-3 py-1.5 shadow shadow-cyan-500/30">
            <FileText size={12} aria-hidden="true" />
            Gerar PDF
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.02] text-slate-300 text-xs px-3 py-1.5">
            Orçamento R$ 2.450,00
          </span>
        </div>
      </div>

      <div className="hidden sm:flex absolute -top-4 -right-3 items-center gap-2.5 rounded-xl border border-white/10 bg-slate-900/85 backdrop-blur-xl px-3.5 py-2.5 shadow-xl shadow-emerald-500/10">
        <span className="grid place-items-center w-7 h-7 rounded-lg bg-emerald-500/15 ring-1 ring-emerald-400/30">
          <CheckCircle2
            size={14}
            className="text-emerald-300"
            aria-hidden="true"
          />
        </span>
        <div className="text-left">
          <p className="text-[11px] font-semibold text-slate-100 leading-tight">
            PDF pronto
          </p>
          <p className="text-[10px] text-slate-400 leading-tight">
            Relatório enviado ao cliente
          </p>
        </div>
      </div>

      <div className="hidden sm:flex absolute -bottom-4 -left-3 items-center gap-2.5 rounded-xl border border-white/10 bg-slate-900/85 backdrop-blur-xl px-3.5 py-2.5 shadow-xl shadow-cyan-500/10">
        <span className="grid place-items-center w-7 h-7 rounded-lg bg-cyan-500/15 ring-1 ring-cyan-400/30">
          <PenLine
            size={14}
            className="text-cyan-300"
            aria-hidden="true"
          />
        </span>
        <div className="text-left">
          <p className="text-[11px] font-semibold text-slate-100 leading-tight">
            Assinatura coletada
          </p>
          <p className="text-[10px] text-slate-400 leading-tight">
            João S. — agora há pouco
          </p>
        </div>
      </div>
    </div>
  )
}
