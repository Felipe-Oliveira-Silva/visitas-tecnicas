import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { QuotationForm } from '../../quotation-form'

export default async function EditarOrcamentoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session || session.user.role === 'READER') redirect('/dashboard/orcamentos')

  const quotation = await prisma.quotation.findFirst({
    where:   { id, companyId: session.user.companyId },
    include: { items: { orderBy: { order: 'asc' } } },
  })

  if (!quotation) notFound()

  // Only DRAFT quotations can be edited — redirect to detail for any other status
  if (quotation.status !== 'DRAFT') redirect(`/dashboard/orcamentos/${id}`)

  const initialData = {
    id:          quotation.id,
    clientId:    quotation.clientId,
    visitId:     quotation.visitId ?? '',
    title:       quotation.title,
    description: quotation.description ?? '',
    notes:       quotation.notes       ?? '',
    validUntil:  quotation.validUntil
      ? quotation.validUntil.toISOString().slice(0, 10)
      : '',
    discount: quotation.discount.toNumber(),
    items:    quotation.items.map(i => ({
      description: i.description,
      quantity:    i.quantity.toNumber(),
      unitPrice:   i.unitPrice.toNumber(),
    })),
  }

  return (
    <div>
      <Link
        href={`/dashboard/orcamentos/${id}`}
        className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 mb-4 transition-colors"
      >
        <ChevronLeft size={15} /> Voltar para orçamento
      </Link>
      <h1 className="text-2xl font-bold text-slate-100 mb-6">Editar Orçamento</h1>
      <QuotationForm mode="edit" initialData={initialData} />
    </div>
  )
}
