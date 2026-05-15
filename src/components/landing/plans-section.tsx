import { PlanCards } from '@/components/plan-cards'
import { Reveal } from './reveal'

interface PlansSectionProps {
  showActivationNote?: boolean
}

export function PlansSection({ showActivationNote = false }: PlansSectionProps) {
  return (
    <section
      id="planos"
      className="relative scroll-mt-24 py-20 md:py-28 border-b border-slate-800"
    >
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center max-w-2xl mx-auto">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/5 px-3 py-1 text-[11px] uppercase tracking-widest text-cyan-300 font-semibold">
              Planos
            </span>
          </Reveal>
          <Reveal delay={80}>
            <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-bold text-balance text-slate-100 leading-tight">
              Planos que crescem com sua{' '}
              <span className="bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text text-transparent">
                empresa
              </span>
            </h2>
          </Reveal>
          <Reveal delay={160}>
            <p className="mt-4 text-base sm:text-lg text-slate-400 max-w-xl mx-auto leading-relaxed">
              Comece simples e evolua conforme sua equipe ganha mais controle
              sobre visitas, relatórios e documentos.
            </p>
          </Reveal>
        </div>

        <Reveal delay={240} className="mt-10 md:mt-14">
          <PlanCards />
        </Reveal>

        {showActivationNote && (
          <p className="mt-8 text-center text-slate-500 text-sm">
            Após o contato, sua conta será ativada em até 24h.
          </p>
        )}
      </div>
    </section>
  )
}
