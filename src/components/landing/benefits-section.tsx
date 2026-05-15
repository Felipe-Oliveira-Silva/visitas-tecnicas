import { CheckCircle2 } from 'lucide-react'
import { Reveal } from './reveal'

interface Benefit {
  title: string
  desc: string
}

const BENEFITS: Benefit[] = [
  {
    title: 'Reduza tempo criando relatórios',
    desc: 'Modelo pronto, fotos anexadas e assinatura em poucos toques.',
  },
  {
    title: 'Padronize entregas para clientes',
    desc: 'Todo documento sai com a mesma identidade profissional.',
  },
  {
    title: 'Tenha histórico organizado',
    desc: 'Cada cliente com tudo o que já foi feito em um único lugar.',
  },
  {
    title: 'Facilite a rotina dos técnicos',
    desc: 'Telas pensadas para usar em campo, direto do celular.',
  },
  {
    title: 'Envie PDFs profissionais',
    desc: 'Documento finalizado com logo, dados e assinatura do cliente.',
  },
  {
    title: 'Acompanhe visitas realizadas e pendentes',
    desc: 'Painel mensal mostra o que foi feito e o que ainda falta.',
  },
]

export function BenefitsSection() {
  return (
    <section className="relative py-20 md:py-28 border-b border-slate-800">
      <div className="mx-auto max-w-5xl px-6">
        <div className="text-center max-w-2xl mx-auto">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/5 px-3 py-1 text-[11px] uppercase tracking-widest text-emerald-300 font-semibold">
              Benefícios
            </span>
          </Reveal>
          <Reveal delay={80}>
            <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-bold text-balance text-slate-100 leading-tight">
              Menos retrabalho.{' '}
              <span className="bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text text-transparent">
                Mais profissionalismo.
              </span>
            </h2>
          </Reveal>
          <Reveal delay={160}>
            <p className="mt-4 text-base sm:text-lg text-slate-400 max-w-xl mx-auto leading-relaxed">
              Padronize a rotina da equipe, organize o histórico dos clientes e
              entregue documentos mais profissionais sem depender de processos
              manuais.
            </p>
          </Reveal>
        </div>

        <div className="mt-10 md:mt-14 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 md:gap-y-7 max-w-4xl mx-auto">
          {BENEFITS.map((benefit, i) => (
            <Reveal key={benefit.title} delay={i * 60}>
              <div className="flex items-start gap-4">
                <span className="shrink-0 grid place-items-center w-9 h-9 rounded-xl bg-emerald-500/10 ring-1 ring-emerald-400/20">
                  <CheckCircle2
                    size={18}
                    className="text-emerald-300"
                    aria-hidden="true"
                  />
                </span>
                <div className="min-w-0">
                  <p className="text-base font-semibold text-slate-100">
                    {benefit.title}
                  </p>
                  <p className="mt-1 text-sm text-slate-400 leading-relaxed">
                    {benefit.desc}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
