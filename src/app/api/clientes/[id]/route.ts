import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateClientSchema = z.object({
  name:    z.string().min(2).optional(),
  cnpj:    z.string().optional(),
  email:   z.string().email().optional().or(z.literal('')),
  phone:   z.string().optional(),
  address: z.string().optional(),
  city:    z.string().optional(),
  state:   z.string().optional(),
  notes:   z.string().optional(),
  active:  z.boolean().optional(),
})

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await auth()

  if (!session || session.user.role === 'READER') {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  const client = await prisma.client.findFirst({
    where: { id, companyId: session.user.companyId },
  })
  if (!client) {
    return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })
  }

  const body = await request.json()
  const parsed = updateClientSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const updated = await prisma.client.update({
    where: { id }, // ← era params.id
    data: {
      ...parsed.data,
      email: parsed.data.email || null,
    },
  })

  return NextResponse.json(updated)
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> } // ← era { id: string }
) {
  const { id } = await params // ← linha nova
  const session = await auth()

  if (!session || session.user.role !== 'ADMIN' && session.user.role !== 'SUPERADMIN') {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  const client = await prisma.client.findFirst({
    where: { id, companyId: session.user.companyId }, // ← era params.id
  })
  if (!client) {
    return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })
  }

  await prisma.client.update({
    where: { id }, // ← era params.id
    data: { active: false },
  })

  return NextResponse.json({ success: true })
}