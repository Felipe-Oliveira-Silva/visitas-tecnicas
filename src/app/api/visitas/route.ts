import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { checkVisitLimit } from '@/lib/plan-limits'

const createSchema = z.object({
  clientId:     z.string().min(1, 'Cliente é obrigatório'),
  technicianId: z.string().min(1, 'Técnico é obrigatório'),
  scheduledAt:  z.string().min(1, 'Data é obrigatória'),
  observations: z.string().optional(),
})

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const visits = await prisma.visit.findMany({
    where: { companyId: session.user.companyId },
    include: {
      client:     { select: { id: true, name: true } },
      technician: { select: { id: true, name: true } },
    },
    orderBy: { scheduledAt: 'desc' },
  })

  return NextResponse.json(visits)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  if (session.user.role === 'READER') {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  const check = await checkVisitLimit(session.user.companyId)
  if (!check.allowed) {
    return NextResponse.json({
      error: 'LIMIT_REACHED',
      resource: 'visits',
      limit: check.limit,
      current: check.current,
      message: `Você atingiu o limite de ${check.limit} visitas este mês. Faça upgrade para continuar registrando visitas.`,
    }, { status: 403 })
  }

  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const { clientId, technicianId, scheduledAt, observations } = parsed.data

  const visit = await prisma.visit.create({
    data: {
      companyId:   session.user.companyId,
      clientId,
      technicianId,
      scheduledAt: new Date(scheduledAt),
      observations: observations || null,
    },
  })

  return NextResponse.json(visit, { status: 201 })
}