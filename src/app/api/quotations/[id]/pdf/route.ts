import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getPresignedDownloadUrl } from '@/lib/r2'

// ── GET /api/quotations/[id]/pdf ──────────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const pdf = await prisma.quotationPdf.findFirst({
    where: { quotationId: id, companyId: session.user.companyId },
  })
  if (!pdf) return NextResponse.json({ error: 'PDF não encontrado' }, { status: 404 })

  try {
    const url = await getPresignedDownloadUrl(pdf.pdfPath, `orcamento_${id}.pdf`, 900)
    return NextResponse.redirect(url)
  } catch (err) {
    console.error('[PDF_DOWNLOAD_ORCAMENTO]', err)
    return NextResponse.json({ error: 'Erro ao gerar link de download' }, { status: 503 })
  }
}
