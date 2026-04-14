import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getPresignedDownloadUrl } from '@/lib/r2'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const pdf = await prisma.reportPdf.findFirst({
    where: { reportId: id, companyId: session.user.companyId },
  })
  if (!pdf) return NextResponse.json({ error: 'PDF não encontrado' }, { status: 404 })

  try {
    const filename = `relatorio_${id}.pdf`
    const url = await getPresignedDownloadUrl(pdf.pdfPath, filename, 900)
    return NextResponse.redirect(url)
  } catch (err) {
    console.error('[PDF_DOWNLOAD]', err)
    return NextResponse.json({ error: 'Erro ao gerar link de download' }, { status: 503 })
  }
}
