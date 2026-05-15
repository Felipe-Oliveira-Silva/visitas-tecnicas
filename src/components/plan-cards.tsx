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
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6 max-w-5xl mx-auto">
        {PLANS.map((plan) => {
          const isCurrent = currentPlan === plan.key
          const isPending = currentSubscription?.planKey === plan.key && currentSubscription.status === 'PENDING'

          return (
            <div
              key={plan.key}
              className={`relative rounded-2xl backdrop-blur-xl p-6 sm:p-7 text-left flex flex-col ${
                plan.popular
                  ? 'border border-cyan-400/40 bg-gradient-to-b from-cyan-500/[0.08] to-white/[0.02] shadow-2xl shadow-cyan-500/15'
                  : 'border border-white/10 bg-white/[0.03]'
              }`}
            >
              {plan.popular && !isCurrent && (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 inline-flex items-center bg-gradient-to-r from-cyan-400 to-blue-500 text-white text-[11px] font-semibold tracking-wide px-3 py-1 rounded-full shadow-lg shadow-cyan-500/30 whitespace-nowrap">
                  Mais popular
                </span>
              )}
              {isCurrent && (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 inline-flex items-center bg-white/10 border border-white/15 text-slate-200 text-[11px] font-semibold tracking-wide px-3 py-1 rounded-full whitespace-nowrap">
                  Seu plano atual
                </span>
              )}

              <p className={`text-[11px] uppercase tracking-widest mb-2 font-semibold ${plan.popular ? 'text-cyan-300' : 'text-slate-400'}`}>
                {plan.name}
              </p>
              <p className="text-4xl font-bold tracking-tight text-slate-100 leading-none mb-1">
                R${plan.price}
                <span className="text-sm font-normal text-slate-400 ml-1">/mês</span>
              </p>
              <p className="text-slate-400 text-sm mt-2 mb-6">{plan.subtitle}</p>

              <ul className="flex-1 space-y-2.5 mb-6 text-sm text-slate-300">
                {plan.features.map((f) => (
                  <li key={f} className="leading-relaxed">✓ {f}</li>
                ))}
              </ul>

              {isCurrent ? (
                <button
                  disabled
                  className="block w-full text-center py-3 min-h-[44px] rounded-xl text-sm font-semibold bg-white/[0.05] border border-white/10 text-slate-400 cursor-not-allowed"
                >
                  Plano atual
                </button>
              ) : isPending ? (
                currentSubscription?.checkoutUrl ? (
                  <a
                    href={currentSubscription.checkoutUrl}
                    className="block w-full text-center bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-white py-3 min-h-[44px] rounded-xl text-sm font-semibold transition-all shadow-lg shadow-amber-500/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#080d14]"
                  >
                    Retomar pagamento
                  </a>
                ) : (
                  <button
                    disabled
                    className="block w-full text-center py-3 min-h-[44px] rounded-xl text-sm font-semibold bg-white/[0.05] border border-white/10 text-slate-400 cursor-not-allowed"
                  >
                    Pagamento pendente
                  </button>
                )
              ) : (
                <button
                  onClick={() => handleSubscribe(plan.key)}
                  disabled={loading === plan.key}
                  className={`block w-full text-center py-3 min-h-[44px] rounded-xl text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#080d14] disabled:opacity-50 disabled:cursor-not-allowed ${
                    plan.popular
                      ? 'bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-white shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 hover:-translate-y-0.5 disabled:hover:translate-y-0'
                      : 'border border-white/15 bg-white/[0.02] text-slate-200 hover:bg-white/[0.06] hover:border-white/25'
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
