import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { renderToBuffer } from '@react-pdf/renderer'
import { OrcamentoPDF } from '@/components/orcamento-pdf'
import { uploadToR2 } from '@/lib/r2'
import React from 'react'

// ── POST /api/quotations/[id]/gerar-pdf ───────────────────────────────────────

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const quotation = await prisma.quotation.findFirst({
      where:   { id, companyId: session.user.companyId },
      include: {
        items:     { orderBy: { order: 'asc' } },
        client:    { select: { name: true, cnpj: true, address: true, city: true, state: true } },
        createdBy: { select: { name: true } },
        company:   true,
      },
    })

    if (!quotation) return NextResponse.json({ error: 'Orçamento não encontrado' }, { status: 404 })

    // Build serializable props — convert all Prisma.Decimal to number
    const props = {
      quotation: {
        id:          quotation.id,
        title:       quotation.title,
        status:      quotation.status,
        description: quotation.description,
        notes:       quotation.notes,
        validUntil:  quotation.validUntil,
        discount:    quotation.discount.toNumber(),
        subtotal:    quotation.subtotal.toNumber(),
        total:       quotation.total.toNumber(),
        createdAt:   quotation.createdAt,
        client: {
          name:    quotation.client.name,
          cnpj:    quotation.client.cnpj,
          address: quotation.client.address,
          city:    quotation.client.city,
          state:   quotation.client.state,
        },
        createdBy: { name: quotation.createdBy.name },
        items: quotation.items.map(i => ({
          description: i.description,
          quantity:    i.quantity.toNumber(),
          unitPrice:   i.unitPrice.toNumber(),
          total:       i.total.toNumber(),
        })),
      },
      generatedAt: new Date(),
      company: {
        name:    quotation.company.name,
        cnpj:    quotation.company.cnpj,
        phone:   quotation.company.phone,
        email:   quotation.company.email,
        address: quotation.company.address,
      },
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const buffer = await renderToBuffer(React.createElement(OrcamentoPDF, props) as any)

    const pdfKey = `${session.user.companyId}/quotations/${id}/orcamento.pdf`
    await uploadToR2(pdfKey, buffer, 'application/pdf', `attachment; filename="orcamento_${id}.pdf"`)

    await prisma.quotationPdf.upsert({
      where:  { quotationId: id },
      create: { quotationId: id, companyId: session.user.companyId, pdfPath: pdfKey },
      update: { pdfPath: pdfKey },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[GERAR_PDF_ORCAMENTO]', error)
    return NextResponse.json({ error: 'Erro ao gerar PDF' }, { status: 500 })
  }
}
