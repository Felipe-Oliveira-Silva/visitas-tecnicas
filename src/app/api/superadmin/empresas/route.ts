import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"

export async function GET() {
  const session = await auth()

  if (!session || session.user.role !== "SUPERADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 })
  }

  const empresas = await prisma.company.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { users: true, visits: true },
      },
    },
  })

  return NextResponse.json(empresas)
}

export async function POST(req: Request) {
  const session = await auth()

  if (!session || session.user.role !== "SUPERADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 })
  }

  const body = await req.json()
  const { nomeEmpresa, cnpj, phone, email, plan, nomeAdmin, emailAdmin, senhaAdmin } = body

  if (!nomeEmpresa || !nomeAdmin || !emailAdmin || !senhaAdmin) {
    return NextResponse.json({ error: "Campos obrigatórios faltando" }, { status: 400 })
  }

  const emailExistente = await prisma.user.findUnique({ where: { email: emailAdmin } })
  if (emailExistente) {
    return NextResponse.json({ error: "Email do admin já está em uso" }, { status: 400 })
  }

  const hashedPassword = await bcrypt.hash(senhaAdmin, 10)

  const empresa = await prisma.company.create({
    data: {
      name: nomeEmpresa,
      cnpj: cnpj || null,
      phone: phone || null,
      email: email || null,
      plan: plan || "start",
      active: true,
      users: {
        create: {
          name: nomeAdmin,
          email: emailAdmin,
          password: hashedPassword,
          role: "ADMIN",
        },
      },
    },
  })

  return NextResponse.json(empresa, { status: 201 })
}