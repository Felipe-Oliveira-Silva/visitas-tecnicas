import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { renderToBuffer } from '@react-pdf/renderer'
import { RelatorioPDF } from '@/components/relatorio-pdf'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import { readFileSync } from 'fs'
import path from 'path'
import React from 'react'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id } = await params

    // Buscar relatório completo
    const report = await prisma.report.findFirst({
      where: {
        id,
        companyId: session.user.companyId,
      },
      include: {
        visit: {
          include: {
            client: true,
            technician: true,
          },
        },
        filledBy: true,
        signature: true,
        company: true,
      },
    })

    if (!report) {
      return NextResponse.json({ error: 'Relatório não encontrado' }, { status: 404 })
    }

    if (report.status === 'DRAFT') {
      return NextResponse.json(
        { error: 'Apenas relatórios finalizados ou assinados podem gerar PDF' },
        { status: 400 }
      )
    }

    // Converter imagem da assinatura para base64 (se existir)
    let imageBase64: string | null = null
    if (report.signature?.imagePath) {
      const absPath = path.join(process.cwd(), 'public', report.signature.imagePath)
      if (existsSync(absPath)) {
        imageBase64 = readFileSync(absPath).toString('base64')
      }
    }

    // Montar objeto para o componente PDF
    const reportData = {
      id: report.id,
      observations: report.observations,
      createdAt: report.createdAt,
      checklistData: report.checklistData as Record<string, boolean> | null,
      measurementData: report.measurementData as Record<string, string> | null,
      visit: {
        scheduledAt: report.visit.scheduledAt,
        realizedAt: report.visit.realizedAt,
        observations: report.visit.observations,
        client: {
          name: report.visit.client.name,
          cnpj: report.visit.client.cnpj,
          address: report.visit.client.address,
          city: report.visit.client.city,
          state: report.visit.client.state,
        },
        technician: {
          name: report.visit.technician.name,
        },
      },
      filledBy: {
        name: report.filledBy.name,
      },
      company: {
        name: report.company.name,
        cnpj: report.company.cnpj,
        phone: report.company.phone,
        email: report.company.email,
        address: report.company.address,
      },
      signature: report.signature
        ? {
            signerName: report.signature.signerName,
            signerDoc: report.signature.signerDoc,
            signedAt: report.signature.signedAt,
            imageBase64: imageBase64 ?? '',
          }
        : null,
    }

    const generatedAt = new Date()

    // Gerar buffer do PDF
    const buffer = await renderToBuffer(
      React.createElement(RelatorioPDF, {
        report: reportData,
        generatedAt,
        plan: report.company.plan as 'start' | 'pro' | 'enterprise',
        company: {
          name: report.company.name,
          cnpj: report.company.cnpj,
          phone: report.company.phone,
          email: report.company.email,
          address: report.company.address,
        },
      }) as any
    )
    

    // Garantir que a pasta existe
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'pdfs')
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    // Salvar arquivo
    const fileName = `relatorio_${id}.pdf`
    const filePath = path.join(uploadsDir, fileName)
    await writeFile(filePath, buffer)

    const pdfPath = `/uploads/pdfs/${fileName}`

    // Criar ou atualizar ReportPdf
    await prisma.reportPdf.upsert({
      where: { reportId: id },
      create: {
        reportId: id,
        companyId: session.user.companyId,
        pdfPath,
      },
      update: {
        pdfPath,
      },
    })

    return NextResponse.json({ pdfPath })
  } catch (error) {
    console.error('[GERAR_PDF]', error)
    return NextResponse.json({ error: 'Erro ao gerar PDF' }, { status: 500 })
  }
}