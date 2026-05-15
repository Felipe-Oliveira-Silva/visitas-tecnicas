import { FaqItem } from '@/components/faq-item'
import { Reveal } from './reveal'

const FAQ_ITEMS = [
  {
    question: 'Preciso instalar aplicativo?',
    answer:
      'Não. O Relatec roda direto no navegador, tanto no computador quanto no celular. Basta acessar e entrar com sua conta.',
  },
  {
    question: 'Funciona no celular?',
    answer:
      'Sim. As telas são pensadas para a equipe usar em campo, durante a visita, direto do smartphone.',
  },
  {
    question: 'Posso testar sem compromisso?',
    answer:
      'Sim. Você cria sua conta e conhece o sistema antes de contratar qualquer plano pago.',
  },
  {
    question: 'Consigo gerar PDF?',
    answer:
      'Sim. Relatórios e orçamentos saem em PDF prontos para enviar ao cliente, já com a identidade da sua empresa.',
  },
  {
    question: 'O sistema serve para construção/reforma?',
    answer:
      'Sim. O Relatec é usado por construtoras, manutenção predial, climatização, energia solar, elétrica, segurança eletrônica e outras áreas técnicas.',
  },
  {
    question: 'Os dados de uma empresa ficam separados das outras?',
    answer:
      'Sim. Cada empresa enxerga apenas o que é seu. Os dados não cruzam entre clientes do Relatec.',
  },
]

export function FaqSection() {
  return (
    <section
      id="faq"
      className="relative scroll-mt-24 py-20 md:py-28 border-b border-slate-800"
    >
      <div className="mx-auto max-w-3xl px-6">
        <div className="text-center max-w-2xl mx-auto">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/5 px-3 py-1 text-[11px] uppercase tracking-widest text-cyan-300 font-semibold">
              FAQ
            </span>
          </Reveal>
          <Reveal delay={80}>
            <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-bold text-balance text-slate-100 leading-tight">
              Perguntas frequentes
            </h2>
          </Reveal>
        </div>

        <div className="mt-10 md:mt-14 space-y-3">
          {FAQ_ITEMS.map((item, i) => (
            <Reveal key={item.question} delay={i * 50}>
              <FaqItem question={item.question} answer={item.answer} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
