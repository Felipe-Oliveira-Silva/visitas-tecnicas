import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { Prisma, ReportStatus } from '@prisma/client'

const createSchema = z.object({
  visitId: z.string().min(1, 'Visita é obrigatória'),
  observations: z.string().optional(),
  checklistData: z.any().optional(),
  measurementData: z.any().optional(),
})

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const technicianId = searchParams.get('technicianId')

  const where: Prisma.ReportWhereInput = {
    companyId: session.user.companyId,
  }

  if (status) {
    where.status = status as ReportStatus
  }

  if (technicianId) {
    where.visit = {
      is: { technicianId },  // ← era where.visit = { technicianId }, sintaxe errada
    }
  }

  const reports = await prisma.report.findMany({
    where,
    include: {
      visit: {
        include: {
          client: { select: { id: true, name: true } },
          technician: { select: { id: true, name: true } },
        },
      },
      signature: { select: { id: true, signerName: true, signedAt: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(reports)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  if (!['ADMIN', 'TECHNICIAN'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const { visitId, observations, checklistData, measurementData } = parsed.data

  // Validar visita
  const visit = await prisma.visit.findFirst({
    where: { id: visitId, companyId: session.user.companyId },
  })
  if (!visit) return NextResponse.json({ error: 'Visita não encontrada' }, { status: 404 })
  if (visit.status !== 'REALIZED') {
    return NextResponse.json({ error: 'Só é possível criar relatório para visitas realizadas' }, { status: 400 })
  }

  // Checar se já existe relatório
  const existing = await prisma.report.findUnique({ where: { visitId } })
  if (existing) {
    return NextResponse.json({ error: 'Esta visita já possui um relatório' }, { status: 409 })
  }

  const report = await prisma.report.create({
    data: {
      companyId: session.user.companyId,
      visitId,
      filledById: session.user.id,
      observations,
      checklistData: checklistData ?? null,
      measurementData: measurementData ?? null,
    },
  })

  return NextResponse.json(report, { status: 201 })
}
