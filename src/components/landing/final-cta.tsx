import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { WHATSAPP_URL } from '@/lib/constants'
import { Reveal } from './reveal'

export function FinalCta() {
  return (
    <section className="relative py-20 md:py-28 border-b border-slate-800">
      <div className="mx-auto max-w-5xl px-6">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/40 backdrop-blur-xl shadow-2xl shadow-cyan-500/15 px-6 py-14 sm:px-10 md:px-12 md:py-20 text-center">
            <div
              aria-hidden="true"
              className="absolute inset-0 -z-10 pointer-events-none"
              style={{
                background:
                  'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(34, 211, 238, 0.25), rgba(59, 130, 246, 0.08) 40%, transparent 80%)',
              }}
            />

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-balance text-slate-100 leading-tight max-w-2xl mx-auto">
              Pronto para organizar suas{' '}
              <span className="bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text text-transparent">
                visitas técnicas?
              </span>
            </h2>

            <p className="mt-5 text-base sm:text-lg text-slate-300 max-w-xl mx-auto leading-relaxed">
              Teste o Relatec e veja como fica mais simples registrar
              atendimentos, gerar documentos e manter histórico dos clientes.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
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
          </div>
        </Reveal>
      </div>
    </section>
  )
}
