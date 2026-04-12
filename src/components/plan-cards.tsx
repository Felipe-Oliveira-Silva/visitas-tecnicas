'use client'

import Link from 'next/link'

interface Plan {
  key: string
  name: string
  price: string
  subtitle: string
  features: string[]
  popular?: boolean
  whatsappMsg: (name: string) => string
}

const PLANS: Plan[] = [
  {
    key: 'start',
    name: 'Básico',
    price: 'R$50',
    subtitle: 'Para começar',
    features: [
      'Até 2 usuários',
      'Até 50 visitas/mês',
      'Relatórios simples',
      'Assinatura básica',
    ],
    whatsappMsg: (name) =>
      `Olá! Me chamo ${name} e gostaria de assinar o plano Básico do Relatec (R$50/mês).`,
  },
  {
    key: 'pro',
    name: 'Profissional',
    price: 'R$110',
    subtitle: 'Para equipes',
    features: [
      'Até 10 usuários',
      'Dashboard completo',
      'Anexos e relatórios avançados',
      'Filtros avançados',
    ],
    popular: true,
    whatsappMsg: (name) =>
      `Olá! Me chamo ${name} e gostaria de assinar o plano Profissional do Relatec (R$110/mês).`,
  },
  {
    key: 'enterprise',
    name: 'Premium',
    price: 'R$250',
    subtitle: 'White-label total',
    features: [
      'Usuários ilimitados',
      'White-label completo',
      'PDF profissional',
      'Armazenamento nuvem',
    ],
    whatsappMsg: (name) =>
      `Olá! Me chamo ${name} e gostaria de assinar o plano Premium do Relatec (R$250/mês).`,
  },
]

const WA_BASE = 'https://wa.me/5511916821634?text='

interface PlanCardsProps {
  userName: string | null
}

export function PlanCards({ userName }: PlanCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
      {PLANS.map((plan) => (
        <div
          key={plan.key}
          className={`bg-[#0d1b2a] rounded-xl p-6 text-left flex flex-col relative ${
            plan.popular
              ? 'border-2 border-cyan-500'
              : 'border border-[#1e3a5f]'
          }`}
        >
          {plan.popular && (
            <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-cyan-500 text-white text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
              Mais popular
            </span>
          )}

          <p
            className={`text-xs uppercase tracking-widest mb-2 ${
              plan.popular ? 'text-cyan-500' : 'text-slate-400'
            }`}
          >
            {plan.name}
          </p>
          <p className="text-3xl font-extrabold text-slate-100 mb-1">
            {plan.price}
            <span className="text-base font-normal text-slate-500">/mês</span>
          </p>
          <p className="text-slate-500 text-sm mb-6">{plan.subtitle}</p>

          <ul className="flex-1 space-y-2 mb-6 text-sm text-slate-400">
            {plan.features.map((f) => (
              <li key={f}>✓ {f}</li>
            ))}
          </ul>

          {userName ? (
            <a
              href={`${WA_BASE}${encodeURIComponent(plan.whatsappMsg(userName))}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center bg-[#25d366] hover:bg-[#20bc5a] text-white py-2.5 rounded-lg text-sm font-semibold transition-colors"
            >
              💬 Assinar pelo WhatsApp
            </a>
          ) : (
            <Link
              href="/cadastro"
              className={`block text-center py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                plan.popular
                  ? 'bg-cyan-500 hover:bg-cyan-400 text-white'
                  : 'border border-cyan-500 text-cyan-500 hover:bg-cyan-500/10'
              }`}
            >
              Cadastrar grátis
            </Link>
          )}
        </div>
      ))}
    </div>
  )
}
