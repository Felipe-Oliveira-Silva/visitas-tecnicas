import {
  HardHat,
  Building2,
  Zap,
  Snowflake,
  Sun,
  Cctv,
  Wrench,
  type LucideIcon,
} from 'lucide-react'
import { Reveal } from './reveal'

interface Niche {
  label: string
  icon: LucideIcon
}

const NICHES: Niche[] = [
  { label: 'Construção e reformas', icon: HardHat },
  { label: 'Manutenção predial', icon: Building2 },
  { label: 'Elétrica e hidráulica', icon: Zap },
  { label: 'Ar-condicionado e climatização', icon: Snowflake },
  { label: 'Energia solar', icon: Sun },
  { label: 'Segurança eletrônica', icon: Cctv },
  { label: 'Assistência técnica', icon: Wrench },
]

export function AudienceSection() {
  return (
    <section className="relative py-20 md:py-28 border-b border-slate-800">
      <div className="mx-auto max-w-5xl px-6">
        <div className="text-center max-w-2xl mx-auto">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/5 px-3 py-1 text-[11px] uppercase tracking-widest text-cyan-300 font-semibold">
              Para quem é
            </span>
          </Reveal>
          <Reveal delay={80}>
            <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-bold text-balance text-slate-100 leading-tight">
              Feito para empresas que atendem clientes{' '}
              <span className="bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text text-transparent">
                em campo
              </span>
            </h2>
          </Reveal>
          <Reveal delay={160}>
            <p className="mt-4 text-base sm:text-lg text-slate-400 max-w-xl mx-auto leading-relaxed">
              Se sua equipe visita clientes, registra serviços e precisa
              entregar documentos profissionais, o Relatec foi pensado para
              essa rotina.
            </p>
          </Reveal>
        </div>

        <div className="mt-10 md:mt-14 flex flex-wrap justify-center gap-3">
          {NICHES.map((niche, i) => {
            const Icon = niche.icon
            return (
              <Reveal key={niche.label} delay={i * 50}>
                <span className="inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.04] backdrop-blur px-4 py-2.5">
                  <span className="grid place-items-center w-7 h-7 rounded-full bg-gradient-to-br from-cyan-400/15 to-blue-500/10 ring-1 ring-cyan-400/20">
                    <Icon
                      size={14}
                      className="text-cyan-300"
                      aria-hidden="true"
                    />
                  </span>
                  <span className="text-sm font-medium text-slate-200 whitespace-nowrap">
                    {niche.label}
                  </span>
                </span>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}
