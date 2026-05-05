import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { Prisma, QuotationStatus } from '@prisma/client'

// ── Zod schemas ───────────────────────────────────────────────────────────────

const itemSchema = z.object({
  description: z.string().min(1, 'Descrição do item é obrigatória').max(500),
  quantity:    z.number().positive('Quantidade deve ser positiva'),
  unitPrice:   z.number().min(0, 'Valor unitário não pode ser negativo'),
  order:       z.number().int().default(0),
})

const createSchema = z.object({
  title:       z.string().min(2, 'Título deve ter ao menos 2 caracteres').max(255),
  description: z.string().max(2000).optional().nullable(),
  notes:       z.string().max(2000).optional().nullable(),
  validUntil:  z.string().datetime().optional().nullable(),
  discount:    z.number().min(0, 'Desconto não pode ser negativo').default(0),
  clientId:    z.string().cuid('Cliente inválido'),
  visitId:     z.string().cuid('Visita inválida').optional().nullable(),
  items:       z.array(itemSchema).min(1, 'Adicione ao menos um item'),
})

// ── Helpers ───────────────────────────────────────────────────────────────────

type RawItem = { description: string; quantity: number; unitPrice: number; order: number }

function computeItems(items: RawItem[]) {
  return items.map(item => ({
    ...item,
    total: new Prisma.Decimal(item.quantity)
      .mul(new Prisma.Decimal(item.unitPrice))
      .toDecimalPlaces(2),
  }))
}

function sumItems(computed: Array<{ total: Prisma.Decimal }>) {
  return computed.reduce((acc, i) => acc.plus(i.total), new Prisma.Decimal(0))
}

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

export function serializeDecimalFields(q: SerializableQuotation) {
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

// ── GET /api/quotations ───────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const statusParam = searchParams.get('status')
  const search      = searchParams.get('search')

  const where: Prisma.QuotationWhereInput = {
    companyId: session.user.companyId,
  }

  const validStatuses = Object.values(QuotationStatus) as string[]
  if (statusParam && validStatuses.includes(statusParam)) {
    where.status = statusParam as QuotationStatus
  }

  if (search) {
    where.OR = [
      { title:  { contains: search, mode: 'insensitive' } },
      { client: { name: { contains: search, mode: 'insensitive' } } },
    ]
  }

  const quotations = await prisma.quotation.findMany({
    where,
    include: {
      client:    { select: { id: true, name: true } },
      visit:     { select: { id: true, scheduledAt: true } },
      createdBy: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(quotations.map(serializeDecimalFields))
}

// ── POST /api/quotations ──────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  if (session.user.role === 'READER') {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const { title, description, notes, validUntil, discount, clientId, visitId, items } = parsed.data
  const companyId = session.user.companyId

  // Validate client belongs to company
  const client = await prisma.client.findFirst({
    where: { id: clientId, companyId },
  })
  if (!client) return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })

  // Validate visit belongs to company AND same client (when provided)
  if (visitId) {
    const visit = await prisma.visit.findFirst({
      where: { id: visitId, companyId, clientId },
    })
    if (!visit) {
      return NextResponse.json(
        { error: 'Visita não encontrada ou não pertence ao cliente informado' },
        { status: 404 }
      )
    }
  }

  // Compute totals server-side — never trust client values
  const computed    = computeItems(items)
  const subtotal    = sumItems(computed)
  const discountDec = new Prisma.Decimal(discount)

  if (discountDec.greaterThan(subtotal)) {
    return NextResponse.json(
      { error: 'O desconto não pode ser maior que o subtotal' },
      { status: 400 }
    )
  }

  const total = subtotal.minus(discountDec).toDecimalPlaces(2)

  const quotation = await prisma.$transaction(async (tx) => {
    return tx.quotation.create({
      data: {
        title,
        description: description ?? null,
        notes:       notes ?? null,
        validUntil:  validUntil ? new Date(validUntil) : null,
        discount:    discountDec,
        subtotal,
        total,
        companyId,
        clientId,
        visitId:     visitId ?? null,
        createdById: session.user.id,
        items: {
          create: computed.map(item => ({
            description: item.description,
            quantity:    item.quantity,
            unitPrice:   item.unitPrice,
            total:       item.total,
            order:       item.order,
          })),
        },
      },
      include: {
        items:     { orderBy: { order: 'asc' } },
        client:    { select: { id: true, name: true } },
        visit:     { select: { id: true, scheduledAt: true } },
        createdBy: { select: { id: true, name: true } },
      },
    })
  })

  return NextResponse.json(serializeDecimalFields(quotation), { status: 201 })
}
