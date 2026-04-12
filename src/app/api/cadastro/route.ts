import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const schema = z.object({
  nomeEmpresa: z.string().min(2, 'Nome da empresa deve ter pelo menos 2 caracteres'),
  nomeAdmin: z.string().min(2, 'Seu nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  phone: z.string().optional(),
  cnpj: z.string().optional(),
})

export async function POST(request: Request) {
  const body = await request.json()
  const parsed = schema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    )
  }

  const { nomeEmpresa, nomeAdmin, email, password, phone, cnpj } = parsed.data

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json(
      { error: 'Este e-mail já está cadastrado.' },
      { status: 400 }
    )
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  await prisma.$transaction([
    prisma.company.create({
      data: {
        name: nomeEmpresa,
        phone: phone ?? null,
        cnpj: cnpj ?? null,
        plan: 'start',
        active: false,
        users: {
          create: {
            name: nomeAdmin,
            email,
            password: hashedPassword,
            role: 'ADMIN',
          },
        },
      },
    }),
  ])

  return NextResponse.json({ ok: true }, { status: 201 })
}
