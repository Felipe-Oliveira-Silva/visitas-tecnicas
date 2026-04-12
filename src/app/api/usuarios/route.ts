import { NextResponse } from 'next/server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { checkUserLimit } from '@/lib/plan-limits'

const createUserSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  role: z.enum(['ADMIN', 'TECHNICIAN', 'READER']),
})

export async function GET() {
  const session = await auth()

  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPERADMIN') {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  const users = await prisma.user.findMany({
    where: { companyId: session.user.companyId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      active: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(users)
}

export async function POST(request: Request) {
  const session = await auth()

  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPERADMIN') {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  const check = await checkUserLimit(session.user.companyId)
  if (!check.allowed) {
    return NextResponse.json({
      error: 'LIMIT_REACHED',
      resource: 'users',
      limit: check.limit,
      current: check.current,
      message: `Você atingiu o limite de ${check.limit} usuários do seu plano. Faça upgrade para adicionar mais usuários.`,
    }, { status: 403 })
  }

  const body = await request.json()
  const parsed = createUserSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const { name, email, password, role } = parsed.data

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ error: 'E-mail já cadastrado' }, { status: 409 })
  }

  const hashedPassword = await bcrypt.hash(password, 12)

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role,
      companyId: session.user.companyId,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      active: true,
      createdAt: true,
    },
  })

  return NextResponse.json(user, { status: 201 })
}
