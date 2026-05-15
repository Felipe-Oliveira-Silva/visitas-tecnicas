import {
  ImageOff,
  PencilLine,
  Receipt,
  Signature,
  SearchX,
  CalendarX,
  type LucideIcon,
} from 'lucide-react'
import { Reveal } from './reveal'

interface Pain {
  title: string
  desc: string
  icon: LucideIcon
}

const PAINS: Pain[] = [
  {
    title: 'Fotos perdidas no WhatsApp',
    desc: 'A foto da visita some no meio das conversas do grupo.',
    icon: ImageOff,
  },
  {
    title: 'Relatórios feitos manualmente',
    desc: 'Tempo perdido digitando no Word a mesma estrutura toda semana.',
    icon: PencilLine,
  },
  {
    title: 'Orçamentos fora do histórico',
    desc: 'Documento solto no e-mail, sem vínculo com a visita que originou.',
    icon: Receipt,
  },
  {
    title: 'Assinatura sem padronização',
    desc: 'Cada técnico coleta de um jeito, e nem sempre fica registrado.',
    icon: Signature,
  },
  {
    title: 'Histórico difícil de encontrar',
    desc: 'O cliente liga pedindo o último atendimento e ninguém sabe onde está.',
    icon: SearchX,
  },
  {
    title: 'Sem visão mensal das visitas',
    desc: 'Sem um painel claro de quem foi visitado, o que falta e o que atrasou.',
    icon: CalendarX,
  },
]

export function PainSection() {
  return (
    <section className="relative py-20 md:py-28 border-b border-slate-800">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center max-w-2xl mx-auto">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/5 px-3 py-1 text-[11px] uppercase tracking-widest text-amber-300 font-semibold">
              O problema
            </span>
          </Reveal>
          <Reveal delay={80}>
            <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-bold text-balance text-slate-100 leading-tight">
              Seus registros técnicos ainda ficam espalhados?
            </h2>
          </Reveal>
          <Reveal delay={160}>
            <p className="mt-4 text-base sm:text-lg text-slate-400 max-w-xl mx-auto leading-relaxed">
              Quando fotos, relatórios, orçamentos e assinaturas ficam em
              lugares diferentes, a equipe perde tempo e o cliente recebe uma
              entrega menos profissional.
            </p>
          </Reveal>
        </div>

        <div className="mt-10 md:mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {PAINS.map((pain, i) => {
            const Icon = pain.icon
            return (
              <Reveal key={pain.title} delay={i * 60} className="h-full">
                <div className="h-full rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur p-5 sm:p-6">
                  <span className="inline-grid place-items-center w-11 h-11 rounded-xl bg-amber-500/10 ring-1 ring-amber-400/20">
                    <Icon
                      size={20}
                      className="text-amber-300"
                      aria-hidden="true"
                    />
                  </span>
                  <p className="mt-4 text-base font-semibold text-slate-100">
                    {pain.title}
                  </p>
                  <p className="mt-1.5 text-sm text-slate-400 leading-relaxed">
                    {pain.desc}
                  </p>
                </div>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}
