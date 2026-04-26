export const BILLING_PLANS = {
  start: {
    key: 'start' as const,
    name: 'Básico',
    description: 'Relatec – Plano Básico',
    price: 49,
    currencyId: 'BRL',
    frequency: 1,
    frequencyType: 'months' as const,
    visitsPerMonth: 30,
    users: 2,
  },
  pro: {
    key: 'pro' as const,
    name: 'Profissional',
    description: 'Relatec – Plano Profissional',
    price: 109,
    currencyId: 'BRL',
    frequency: 1,
    frequencyType: 'months' as const,
    visitsPerMonth: 300,
    users: 10,
  },
  enterprise: {
    key: 'enterprise' as const,
    name: 'Premium',
    description: 'Relatec – Plano Premium',
    price: 249,
    currencyId: 'BRL',
    frequency: 1,
    frequencyType: 'months' as const,
    visitsPerMonth: null,
    users: null,
  },
} as const

export type PlanKey = keyof typeof BILLING_PLANS
