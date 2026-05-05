import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { Prisma } from '@prisma/client'

// ── Zod schemas ───────────────────────────────────────────────────────────────

const itemSchema = z.object({
  description: z.string().min(1, 'Descrição do item é obrigatória').max(500),
  quantity:    z.number().positive('Quantidade deve ser positiva'),
  unitPrice:   z.number().min(0, 'Valor unitário não pode ser negativo'),
  order:       z.number().int().default(0),
})

const updateSchema = z.object({
  title:       z.string().min(2).max(255).optional(),
  description: z.string().max(2000).optional().nullable(),
  notes:       z.string().max(2000).optional().nullable(),
  validUntil:  z.string().datetime().optional().nullable(),
  discount:    z.number().min(0).optional(),
  clientId:    z.string().cuid().optional(),
  visitId:     z.string().cuid().optional().nullable(),
  items:       z.array(itemSchema).min(1).optional(),
})

// ── Helper ────────────────────────────────────────────────────────────────────

interface SerializableItem {
  quantity:  Prisma.Decimal
  unitPrice: Prisma.Decimal
  total:     Prisma.Decimal
  [key: string]: unknown
}

interface SerializableQuotation {
  discount: Prisma.Decimal
  subtotal: Prisma.Decimal
  total:    Prisma.Decimal
  items?:   SerializableItem[] | null
  [key: string]: unknown
}

function serializeDecimalFields(q: SerializableQuotation) {
  return {
    ...q,
    discount: q.discount.toNumber(),
    subtotal: q.subtotal.toNumber(),
    total:    q.total.toNumber(),
    items: q.items?.map(item => ({
      ...item,
      quantity:  item.quantity.toNumber(),
      unitPrice: item.unitPrice.toNumber(),
      total:     item.total.toNumber(),
    })),
  }
}

// ── GET /api/quotations/[id] ──────────────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const quotation = await prisma.quotation.findFirst({
    where: { id, companyId: session.user.companyId },
    include: {
      items:     { orderBy: { order: 'asc' } },
      client:    { select: { id: true, name: true, phone: true, email: true, city: true, state: true } },
      visit:     { select: { id: true, scheduledAt: true, status: true } },
      createdBy: { select: { id: true, name: true } },
      pdf:       true,
    },
  })

  if (!quotation) return NextResponse.json({ error: 'Orçamento não encontrado' }, { status: 404 })

  return NextResponse.json(serializeDecimalFields(quotation))
}

// ── PUT /api/quotations/[id] ──────────────────────────────────────────────────

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  if (session.user.role === 'READER') {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  // Fetch existing — tenant-isolated
  const existing = await prisma.quotation.findFirst({
    where: { id, companyId: session.user.companyId },
  })
  if (!existing) return NextResponse.json({ error: 'Orçamento não encontrado' }, { status: 404 })
  if (existing.status !== 'DRAFT') {
    return NextResponse.json(
      { error: 'Apenas orçamentos em rascunho podem ser editados' },
      { status: 400 }
    )
  }

  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const data       = parsed.data
  const companyId  = session.user.companyId
  const effectiveClientId = data.clientId ?? existing.clientId

  // Validate new clientId if being changed
  if (data.clientId) {
    const client = await prisma.client.findFirst({
      where: { id: data.clientId, companyId },
    })
    if (!client) return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })
  }

  // Use raw body to detect explicit null (clearing visitId or validUntil)
  const visitIdInBody    = 'visitId' in body
  const validUntilInBody = 'validUntil' in body
  const effectiveVisitId = visitIdInBody ? data.visitId : existing.visitId

  // Validate visitId if being set (not cleared)
  if (effectiveVisitId) {
    const visit = await prisma.visit.findFirst({
      where: { id: effectiveVisitId, companyId, clientId: effectiveClientId },
    })
    if (!visit) {
      return NextResponse.json(
        { error: 'Visita não encontrada ou não pertence ao cliente informado' },
        { status: 404 }
      )
    }
  }

  // Compute totals — reuse existing subtotal if items not provided
  let subtotal: Prisma.Decimal = existing.subtotal
  let newItems: Array<{
    description: string
    quantity:    number
    unitPrice:   number
    order:       number
    total:       Prisma.Decimal
  }> | null = null

  if (data.items) {
    newItems = data.items.map(item => ({
      ...item,
      total: new Prisma.Decimal(item.quantity)
        .mul(new Prisma.Decimal(item.unitPrice))
        .toDecimalPlaces(2),
    }))
    subtotal = newItems.reduce((acc, i) => acc.plus(i.total), new Prisma.Decimal(0))
  }

  const discountDec: Prisma.Decimal = data.discount !== undefined
    ? new Prisma.Decimal(data.discount)
    : existing.discount

  if (discountDec.greaterThan(subtotal)) {
    return NextResponse.json(
      { error: 'O desconto não pode ser maior que o subtotal' },
      { status: 400 }
    )
  }

  const total = subtotal.minus(discountDec).toDecimalPlaces(2)

  const updated = await prisma.$transaction(async (tx) => {
    // Replace items only when new ones are provided
    if (newItems !== null) {
      await tx.quotationItem.deleteMany({ where: { quotationId: id } })
    }

    return tx.quotation.update({
      where: { id },
      data: {
        title:       data.title,
        description: data.description,
        notes:       data.notes,
        validUntil:  validUntilInBody
          ? (data.validUntil ? new Date(data.validUntil) : null)
          : undefined,
        discount:    discountDec,
        subtotal,
        total,
        clientId:    data.clientId,
        visitId:     visitIdInBody ? data.visitId : undefined,
        ...(newItems !== null ? {
          items: {
            create: newItems.map(item => ({
              description: item.description,
              quantity:    item.quantity,
              unitPrice:   item.unitPrice,
              total:       item.total,
              order:       item.order,
            })),
          },
        } : {}),
      },
      include: {
        items:     { orderBy: { order: 'asc' } },
        client:    { select: { id: true, name: true } },
        visit:     { select: { id: true, scheduledAt: true, status: true } },
        createdBy: { select: { id: true, name: true } },
        pdf:       true,
      },
    })
  })

  return NextResponse.json(serializeDecimalFields(updated))
}
