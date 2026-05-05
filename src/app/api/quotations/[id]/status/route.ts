import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const statusTransitionSchema = z.object({
  status: z.enum(['SENT', 'APPROVED', 'REJECTED']),
})

// ── PATCH /api/quotations/[id]/status ────────────────────────────────────────

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  if (session.user.role === 'READER') {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  const existing = await prisma.quotation.findFirst({
    where: { id, companyId: session.user.companyId },
    select: { id: true, status: true },
  })
  if (!existing) return NextResponse.json({ error: 'Orçamento não encontrado' }, { status: 404 })

  const body = await req.json()
  const parsed = statusTransitionSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const { status: newStatus } = parsed.data
  const currentStatus = existing.status
  const isAdminOrSuper = session.user.role === 'ADMIN' || session.user.role === 'SUPERADMIN'

  // State machine — explicit transitions only, no backward moves
  if (currentStatus === 'DRAFT' && newStatus === 'SENT') {
    // Any non-READER can mark as sent — role check already done above
  } else if (
    currentStatus === 'SENT' &&
    (newStatus === 'APPROVED' || newStatus === 'REJECTED')
  ) {
    if (!isAdminOrSuper) {
      return NextResponse.json(
        { error: 'Apenas administradores podem aprovar ou rejeitar orçamentos' },
        { status: 403 }
      )
    }
  } else {
    return NextResponse.json(
      { error: `Transição de '${currentStatus}' para '${newStatus}' não é permitida` },
      { status: 400 }
    )
  }

  const updated = await prisma.quotation.update({
    where: { id },
    data:  { status: newStatus },
    select: { id: true, status: true, updatedAt: true },
  })

  return NextResponse.json(updated)
}
