import { prisma } from '@/lib/prisma'

export const PLAN_LIMITS: Record<string, { visitsPerMonth: number | null; users: number | null }> = {
  start:      { visitsPerMonth: 30,   users: 2    },
  pro:        { visitsPerMonth: 300,  users: 10   },
  enterprise: { visitsPerMonth: null, users: null },
}

function getMonthRangeUTC(): { gte: Date; lt: Date } {
  const now = new Date()
  const gte = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
  const lt  = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1))
  return { gte, lt }
}

async function getCompanyPlan(companyId: string): Promise<string> {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { plan: true },
  })
  if (!company) throw new Error(`Company not found: ${companyId}`)
  if (!PLAN_LIMITS[company.plan]) throw new Error(`Unknown plan: ${company.plan}`)
  return company.plan
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
