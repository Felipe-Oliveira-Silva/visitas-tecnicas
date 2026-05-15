import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { WHATSAPP_URL } from '@/lib/constants'
import { Reveal } from './reveal'
import { HeroMockup } from './hero-mockup'

export function Hero() {
  return (
    <section className="relative">
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(34, 211, 238, 0.18), rgba(59, 130, 246, 0.05) 35%, transparent 70%)',
        }}
      />

      <div className="mx-auto max-w-7xl px-6 pt-12 md:pt-20 pb-24 md:pb-32 grid lg:grid-cols-[1.05fr_1fr] gap-12 lg:gap-16 items-center">
        <div className="text-center lg:text-left max-w-2xl mx-auto lg:mx-0">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/5 px-3 py-1 text-[11px] uppercase tracking-widest text-cyan-300 font-semibold">
              <span
                aria-hidden="true"
                className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse motion-reduce:animate-none"
              />
              Gestão de visitas técnicas
            </span>
          </Reveal>

          <Reveal delay={120}>
            <h1 className="mt-6 text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-balance text-slate-100 leading-[1.05]">
              Do atendimento ao{' '}
              <span className="bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text text-transparent">
                PDF final
              </span>
              , organize suas visitas técnicas em minutos.
            </h1>
          </Reveal>

          <Reveal delay={220}>
            <p className="mt-6 text-base sm:text-lg text-slate-300 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Agende visitas, registre fotos, gere relatórios, crie orçamentos
              e colete assinatura do cliente em uma única plataforma.
            </p>
          </Reveal>

          <Reveal delay={300}>
            <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-3">
              <Link
                href="/cadastro"
                className="group inline-flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-400 to-blue-500 text-white text-sm font-semibold px-5 py-3 rounded-xl shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 hover:-translate-y-0.5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#080d14]"
              >
                Testar gratuitamente
                <ArrowRight
                  size={16}
                  aria-hidden="true"
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </Link>
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center border border-white/15 bg-white/[0.02] text-slate-200 text-sm font-medium px-5 py-3 rounded-xl hover:bg-white/[0.06] hover:border-white/25 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#080d14]"
              >
                Solicitar demonstração
              </a>
            </div>
          </Reveal>

          <Reveal delay={400}>
            <p className="mt-5 text-xs text-slate-500">
              Sem compromisso. Ideal para equipes técnicas em campo.
            </p>
          </Reveal>
        </div>

        <Reveal delay={300} className="w-full">
          <HeroMockup />
        </Reveal>
      </div>
    </section>
  )
}
