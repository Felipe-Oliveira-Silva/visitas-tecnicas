'use client'

import Link from 'next/link'
import { WHATSAPP_URL } from '@/lib/constants'

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
    price: 'R$49',
    subtitle: 'Para começar',
    features: [
      'Até 2 usuários',
      'Até 30 visitas/mês',
      'Relatórios simples',
      'Assinatura básica',
    ],
    whatsappMsg: (name) =>
      `Olá! Me chamo ${name} e gostaria de assinar o plano Básico do Relatec (R$49/mês).`,
  },
  {
    key: 'pro',
    name: 'Profissional',
    price: 'R$109',
    subtitle: 'Para equipes',
    features: [
      'Até 10 usuários',
      'Até 300 visitas/mês',
      'Dashboard completo',
      'Filtros avançados',
    ],
    popular: true,
    whatsappMsg: (name) =>
      `Olá! Me chamo ${name} e gostaria de assinar o plano Profissional do Relatec (R$109/mês).`,
  },
  {
    key: 'enterprise',
    name: 'Premium',
    price: 'R$249',
    subtitle: 'White-label total',
    features: [
      'Usuários ilimitados',
      'Visitas ilimitadas',
      'White-label completo',
      'PDF profissional',
    ],
    whatsappMsg: (name) =>
      `Olá! Me chamo ${name} e gostaria de assinar o plano Premium do Relatec (R$249/mês).`,
  },
]

const WA_BASE = `${WHATSAPP_URL}?text=`

interface PlanCardsProps {
  userName: string | null
  currentPlan?: string
}

export function PlanCards({ userName, currentPlan }: PlanCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
      {PLANS.map((plan) => {
        const isCurrent = currentPlan === plan.key
        return (
          <div
            key={plan.key}
            className={`bg-[#0d1b2a] rounded-xl p-6 text-left flex flex-col relative ${
              plan.popular
                ? 'border-2 border-cyan-500'
                : 'border border-[#1e3a5f]'
            }`}
          >
            {plan.popular && !isCurrent && (
              <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-cyan-500 text-white text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
                Mais popular
              </span>
            )}
            {isCurrent && (
              <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-slate-600 text-slate-200 text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
                Seu plano atual
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

            {isCurrent ? (
              <button
                disabled
                className="block w-full text-center py-2.5 rounded-lg text-sm font-semibold bg-slate-700 text-slate-500 cursor-not-allowed"
              >
                Plano atual
              </button>
            ) : userName ? (
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
        )
      })}
    </div>
  )
}
