import { prisma } from '@/lib/prisma'
import { BILLING_PLANS, PlanKey } from './billing'

export type { PlanKey } from './billing'

export const PLAN_LIMITS: Record<PlanKey, { visitsPerMonth: number | null; users: number | null }> = {
  start:      { visitsPerMonth: BILLING_PLANS.start.visitsPerMonth,      users: BILLING_PLANS.start.users      },
  pro:        { visitsPerMonth: BILLING_PLANS.pro.visitsPerMonth,        users: BILLING_PLANS.pro.users        },
  enterprise: { visitsPerMonth: BILLING_PLANS.enterprise.visitsPerMonth, users: BILLING_PLANS.enterprise.users },
}

function getMonthRangeUTC(): { gte: Date; lt: Date } {
  const now = new Date()
  const gte = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
  const lt  = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1))
  return { gte, lt }
}

async function getCompanyPlan(companyId: string): Promise<PlanKey> {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { plan: true },
  })
  if (!company) throw new Error(`Company not found: ${companyId}`)
  const plan = company.plan
  if (!plan || !PLAN_LIMITS[plan as PlanKey]) throw new Error(`No active plan for company: ${companyId}`)
  return plan as PlanKey
}

export async function getUsage(companyId: string): Promise<{
  visitsThisMonth: number
  activeUsers: number
}> {
  const { gte, lt } = getMonthRangeUTC()
  const [visitsThisMonth, activeUsers] = await Promise.all([
    prisma.visit.count({ where: { companyId, createdAt: { gte, lt } } }),
    prisma.user.count({ where: { companyId, active: true } }),
  ])
  return { visitsThisMonth, activeUsers }
}

/**
 * Checks whether a new visit can be created for the given company.
 * When limit is null (unlimited plan), returns current: 0 — for display counts use getUsage() instead.
 */
export async function checkVisitLimit(companyId: string): Promise<{
  allowed: boolean
  limit: number | null
  current: number
}> {
  const plan = await getCompanyPlan(companyId)
  const limit = PLAN_LIMITS[plan].visitsPerMonth
  if (limit === null) return { allowed: true, limit: null, current: 0 }
  const { gte, lt } = getMonthRangeUTC()
  const current = await prisma.visit.count({ where: { companyId, createdAt: { gte, lt } } })
  return { allowed: current < limit, limit, current }
}

/**
 * Checks whether a new user can be created for the given company.
 * When limit is null (unlimited plan), returns current: 0 — for display counts use getUsage() instead.
 */
export async function checkUserLimit(companyId: string): Promise<{
  allowed: boolean
  limit: number | null
  current: number
}> {
  const plan = await getCompanyPlan(companyId)
  const limit = PLAN_LIMITS[plan].users
  if (limit === null) return { allowed: true, limit: null, current: 0 }
  const current = await prisma.user.count({ where: { companyId, active: true } })
  return { allowed: current < limit, limit, current }
}
