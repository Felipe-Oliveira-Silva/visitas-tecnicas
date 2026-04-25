import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getPresignedViewUrl } from '@/lib/r2'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const signature = await prisma.signature.findFirst({
    where: { reportId: id, companyId: session.user.companyId },
  })
  if (!signature) return NextResponse.json({ error: 'Assinatura não encontrada' }, { status: 404 })

  try {
    const url = await getPresignedViewUrl(signature.imagePath, 900)
    return NextResponse.redirect(url)
  } catch (err) {
    console.error('[SIGNATURE_IMAGE]', err)
    return NextResponse.json({ error: 'Erro ao gerar link da assinatura' }, { status: 503 })
  }
}
