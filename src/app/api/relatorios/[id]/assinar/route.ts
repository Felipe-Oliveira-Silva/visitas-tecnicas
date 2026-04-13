import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { uploadToR2 } from '@/lib/r2'

const signSchema = z.object({
  signerName: z.string().min(1, 'Nome do signatário é obrigatório'),
  signerDoc: z.string().optional(),
  imageBase64: z.string().min(1, 'Assinatura é obrigatória'),
})

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
  if (report.status !== 'FINALIZED') {
    return NextResponse.json({ error: 'Apenas relatórios finalizados podem ser assinados' }, { status: 400 })
  }

  const existingSig = await prisma.signature.findUnique({ where: { reportId: id } })
  if (existingSig) {
    return NextResponse.json({ error: 'Este relatório já foi assinado' }, { status: 409 })
  }

  const body = await req.json()
  const parsed = signSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const { signerName, signerDoc, imageBase64 } = parsed.data

  const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '')
  const buffer = Buffer.from(base64Data, 'base64')
  const key = `${session.user.companyId}/signatures/${id}.png`
  await uploadToR2(key, buffer, 'image/png')
  const imagePath = key

  const [signature] = await prisma.$transaction([
    prisma.signature.create({
      data: {
        companyId: session.user.companyId,
        reportId: id,
        signerName,
        signerDoc: signerDoc || null,
        imagePath,
        evidenceData: {
          ip: req.headers.get('x-forwarded-for') || 'unknown',
          userAgent: req.headers.get('user-agent') || 'unknown',
          signedBy: session.user.id,
        },
      },
    }),
    prisma.report.update({
      where: { id },
      data: { status: 'SIGNED' },
    }),
  ])

  return NextResponse.json(signature, { status: 201 })
}