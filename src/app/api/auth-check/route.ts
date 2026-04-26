import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email")

  if (!email) {
    return NextResponse.json({ ok: true })
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: { company: true },
  })

  if (!user || !user.active) {
    return NextResponse.json({ ok: true }) // deixa o signIn tratar
  }

  if (!user.company.active && user.role !== 'SUPERADMIN') {
    return NextResponse.json({ ok: false, reason: "company_inactive" })
  }

  return NextResponse.json({ ok: true })
}
