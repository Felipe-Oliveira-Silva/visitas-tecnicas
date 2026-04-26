import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateSchema = z.object({
  observations: z.string().optional(),
  checklistData: z.any().optional(),
  measurementData: z.any().optional(),
})

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const report = await prisma.report.findFirst({
    where: { id, companyId: session.user.companyId },
    include: {
      visit: {
        include: {
          client: true,
          technician: { select: { id: true, name: true, email: true } },
        },
      },
      filledBy: { select: { id: true, name: true, email: true } },
      attachments: true,
      signature: true,
      pdf: true,
    },
  })

  if (!report) return NextResponse.json({ error: 'Relatório não encontrado' }, { status: 404 })

  return NextResponse.json(report)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  if (!['ADMIN', 'TECHNICIAN'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  const report = await prisma.report.findFirst({
    where: { id, companyId: session.user.companyId },
  })
  if (!report) return NextResponse.json({ error: 'Relatório não encontrado' }, { status: 404 })
  if (report.status !== 'DRAFT') {
    return NextResponse.json({ error: 'Apenas relatórios em rascunho podem ser editados' }, { status: 400 })
  }

  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const updated = await prisma.report.update({
    where: { id },
    data: {
      observations: parsed.data.observations,
      checklistData: parsed.data.checklistData ?? undefined,
      measurementData: parsed.data.measurementData ?? undefined,
    },
  })

  return NextResponse.json(updated)
}