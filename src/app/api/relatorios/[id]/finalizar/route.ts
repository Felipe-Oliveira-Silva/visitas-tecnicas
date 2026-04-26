import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  if (!['ADMIN', 'TECHNICIAN'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  const report = await prisma.report.findFirst({
    where: { id, companyId: session.user.companyId },
  })
  if (!report) return NextResponse.json({ error: 'Relatório não encontrado' }, { status: 404 })
  if (report.status !== 'DRAFT') {
    return NextResponse.json({ error: 'Apenas relatórios em rascunho podem ser finalizados' }, { status: 400 })
  }

  const updated = await prisma.report.update({
    where: { id },
    data: { status: 'FINALIZED' },
  })

  return NextResponse.json(updated)
}