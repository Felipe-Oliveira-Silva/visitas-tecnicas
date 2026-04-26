import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()

  if (!session || session.user.role !== "SUPERADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 })
  }

  const { id } = await params

  const empresa = await prisma.company.findUnique({
    where: { id },
    include: {
      users: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          active: true,
          createdAt: true,
        },
        orderBy: { createdAt: "asc" },
      },
      _count: {
        select: { visits: true, clients: true },
      },
    },
  })

  if (!empresa) {
    return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 })
  }

  return NextResponse.json(empresa)
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()

  if (!session || session.user.role !== "SUPERADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json()

  const empresa = await prisma.company.update({
    where: { id },
    data: {
      ...(body.plan !== undefined && { plan: body.plan }),
      ...(body.active !== undefined && { active: body.active }),
    },
  })

  return NextResponse.json(empresa)
}