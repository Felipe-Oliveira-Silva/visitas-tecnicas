'use client'

import { useState } from 'react'
import { BILLING_PLANS } from '@/lib/billing'

const PLANS = [
  { ...BILLING_PLANS.start, subtitle: 'Para começar', popular: false, features: ['Até 2 usuários', 'Até 30 visitas/mês', 'Relatórios simples', 'Assinatura básica'] },
  { ...BILLING_PLANS.pro,   subtitle: 'Para equipes',  popular: true,  features: ['Até 10 usuários', 'Até 300 visitas/mês', 'Dashboard completo', 'Filtros avançados'] },
  { ...BILLING_PLANS.enterprise, subtitle: 'White-label total', popular: false, features: ['Usuários ilimitados', 'Visitas ilimitadas', 'White-label completo', 'PDF profissional'] },
]

interface CurrentSubscription {
  planKey: string
  status: 'PENDING' | 'ACTIVE' | 'PAUSED' | 'CANCELLED'
  checkoutUrl: string | null
}

interface PlanCardsProps {
  currentPlan?: string | null
  currentSubscription?: CurrentSubscription | null
}

export function PlanCards({ currentPlan, currentSubscription }: PlanCardsProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string>('')

  async function handleSubscribe(planKey: string) {
    setLoading(planKey)
    setError('')
    try {
      const res = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planKey }),
      })
      const data = await res.json() as { checkoutUrl?: string; error?: string }
      if (res.ok && data.checkoutUrl) {
        window.location.href = data.checkoutUrl
      } else {
        setError(data.error ?? 'Erro ao criar assinatura')
      }
    } catch {
      setError('Erro de conexão')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">
          {error}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        {PLANS.map((plan) => {
          const isCurrent = currentPlan === plan.key
          const isPending = currentSubscription?.planKey === plan.key && currentSubscription.status === 'PENDING'

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

              <p className={`text-xs uppercase tracking-widest mb-2 ${plan.popular ? 'text-cyan-500' : 'text-slate-400'}`}>
                {plan.name}
              </p>
              <p className="text-3xl font-extrabold text-slate-100 mb-1">
                R${plan.price}
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
              ) : isPending ? (
                currentSubscription?.checkoutUrl ? (
                  <a
                    href={currentSubscription.checkoutUrl}
                    className="block text-center bg-amber-500 hover:bg-amber-400 text-white py-2.5 rounded-lg text-sm font-semibold transition-colors"
                  >
                    Retomar pagamento
                  </a>
                ) : (
                  <button
                    disabled
                    className="block w-full text-center py-2.5 rounded-lg text-sm font-semibold bg-slate-700 text-slate-500 cursor-not-allowed"
                  >
                    Pagamento pendente
                  </button>
                )
              ) : (
                <button
                  onClick={() => handleSubscribe(plan.key)}
                  disabled={loading === plan.key}
                  className={`block w-full text-center py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                    plan.popular
                      ? 'bg-cyan-500 hover:bg-cyan-400 text-white disabled:opacity-50'
                      : 'border border-cyan-500 text-cyan-500 hover:bg-cyan-500/10 disabled:opacity-50'
                  }`}
                >
                  {loading === plan.key ? 'Aguarde...' : 'Assinar'}
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
