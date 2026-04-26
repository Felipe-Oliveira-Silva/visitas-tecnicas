import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateSchema = z.object({
  clientId:           z.string().min(1).optional(),
  technicianId:       z.string().min(1).optional(),
  scheduledAt:        z.string().optional(),
  observations:       z.string().optional(),
  status:             z.enum(['SCHEDULED', 'REALIZED', 'NOT_REALIZED']).optional(),
  notRealizedReason:  z.string().optional(),
  statusNote:         z.string().optional(),
})

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const visit = await prisma.visit.findFirst({
    where: { id, companyId: session.user.companyId },
    include: {
      client:     { select: { id: true, name: true, address: true, city: true, state: true } },
      technician: { select: { id: true, name: true } },
      statusHistory: {
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!visit) return NextResponse.json({ error: 'Visita não encontrada' }, { status: 404 })
  return NextResponse.json(visit)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  if (session.user.role === 'READER')
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })

  const existing = await prisma.visit.findFirst({
    where: { id, companyId: session.user.companyId },
  })
  if (!existing) return NextResponse.json({ error: 'Visita não encontrada' }, { status: 404 })

  const { status, statusNote, notRealizedReason, scheduledAt, ...rest } = parsed.data

  const visit = await prisma.visit.update({
    where: { id },
    data: {
      ...rest,
      ...(scheduledAt && { scheduledAt: new Date(scheduledAt) }),
      ...(status === 'REALIZED'     && { realizedAt: new Date() }),
      ...(status === 'NOT_REALIZED' && { notRealizedReason }),
      ...(status && { status }),
    },
  })

  if (status) {
    await prisma.visitStatusHistory.create({
      data: {
        visitId:   id,
        status,
        changedBy: session.user.id,
        note:      statusNote ?? null,
      },
    })
  }

  return NextResponse.json(visit)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPERADMIN')
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  await prisma.visit.delete({ where: { id } })
  return NextResponse.json({ success: true })
}