import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const updateUserSchema = z.object({
  name:     z.string().min(2).optional(),
  email:    z.string().email().optional(),
  password: z.string().min(6).optional(),
  role:     z.enum(['ADMIN', 'TECHNICIAN', 'READER']).optional(),
  active:   z.boolean().optional(),
})

async function guardAdmin(userId: string, companyId: string) {
  return prisma.user.findFirst({ where: { id: userId, companyId } })
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await auth()

  if (!session || session.user.role !== 'ADMIN' && session.user.role !== 'SUPERADMIN') {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  const user = await guardAdmin(id, session.user.companyId)
  if (!user) {
    return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
  }

  const body = await request.json()
  const parsed = updateUserSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const data: Record<string, unknown> = { ...parsed.data }
  if (data.password) {
    data.password = await bcrypt.hash(data.password as string, 12)
  }

  const updated = await prisma.user.update({
    where: { id },
    data,
    select: {
      id: true, name: true, email: true,
      role: true, active: true, createdAt: true,
    },
  })

  return NextResponse.json(updated)
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await auth()

  if (!session || session.user.role !== 'ADMIN' && session.user.role !== 'SUPERADMIN') {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  if (id === session.user.id) {
    return NextResponse.json({ error: 'Você não pode excluir sua própria conta' }, { status: 400 })
  }

  const user = await guardAdmin(id, session.user.companyId)
  if (!user) {
    return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
  }

  await prisma.user.update({
    where: { id },
    data: { active: false },
  })

  return NextResponse.json({ success: true })
}