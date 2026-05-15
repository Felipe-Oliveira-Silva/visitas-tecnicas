import {
  UserPlus,
  CalendarPlus,
  Camera,
  FileText,
  PenLine,
  Download,
  type LucideIcon,
} from 'lucide-react'
import { Reveal } from './reveal'

interface Step {
  title: string
  icon: LucideIcon
}

const STEPS: Step[] = [
  { title: 'Cadastre o cliente', icon: UserPlus },
  { title: 'Agende a visita', icon: CalendarPlus },
  { title: 'Registre fotos e observações', icon: Camera },
  { title: 'Gere relatório ou orçamento', icon: FileText },
  { title: 'Colete assinatura', icon: PenLine },
  { title: 'Baixe o PDF final', icon: Download },
]

export function SolutionFlow() {
  return (
    <section
      id="como-funciona"
      className="relative scroll-mt-24 py-20 md:py-28 border-b border-slate-800"
    >
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center max-w-2xl mx-auto">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/5 px-3 py-1 text-[11px] uppercase tracking-widest text-cyan-300 font-semibold">
              Como funciona
            </span>
          </Reveal>
          <Reveal delay={80}>
            <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-bold text-balance text-slate-100 leading-tight">
              O Relatec centraliza o fluxo da{' '}
              <span className="bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text text-transparent">
                visita técnica
              </span>
            </h2>
          </Reveal>
          <Reveal delay={160}>
            <p className="mt-4 text-base sm:text-lg text-slate-400 max-w-xl mx-auto leading-relaxed">
              Da primeira visita ao PDF final, tudo fica registrado em uma
              sequência simples para sua equipe trabalhar melhor em campo.
            </p>
          </Reveal>
        </div>

        <div className="relative mt-10 md:mt-14">
          <div
            aria-hidden="true"
            className="hidden lg:block absolute top-12 left-[8.5%] right-[8.5%] h-px border-t border-dashed border-cyan-400/40"
          />

          <div className="relative grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-5 lg:gap-3">
            {STEPS.map((step, i) => {
              const Icon = step.icon
              return (
                <Reveal key={step.title} delay={i * 60} className="h-full">
                  <div className="h-full rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur p-4 lg:p-5">
                    <div className="flex items-center gap-4 md:flex-col md:items-center md:text-center md:gap-0">
                      <span className="relative shrink-0 inline-grid place-items-center w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-400/15 to-blue-500/10 ring-1 ring-cyan-400/20">
                        <Icon
                          size={20}
                          className="text-cyan-300"
                          aria-hidden="true"
                        />
                        <span
                          aria-hidden="true"
                          className="absolute -top-1.5 -right-1.5 grid place-items-center w-5 h-5 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 text-[10px] font-bold text-white shadow shadow-cyan-500/30"
                        >
                          {i + 1}
                        </span>
                      </span>
                      <p className="text-sm font-semibold text-slate-100 md:mt-3">
                        <span className="sr-only">Passo {i + 1}: </span>
                        {step.title}
                      </p>
                    </div>
                  </div>
                </Reveal>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
