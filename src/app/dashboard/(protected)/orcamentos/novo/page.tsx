import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { QuotationForm } from '../quotation-form'

type SearchParams = { visitId?: string }

export default async function NovoOrcamentoPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await auth()
  if (!session || session.user.role === 'READER') redirect('/dashboard/orcamentos')

  let initialClientId = ''
  let initialVisitId  = ''

  if (searchParams.visitId) {
    const visit = await prisma.visit.findFirst({
      where:  { id: searchParams.visitId, companyId: session.user.companyId },
      select: { id: true, clientId: true },
    })
    if (visit) {
      initialClientId = visit.clientId
      initialVisitId  = visit.id
    }
  }

  return (
    <div>
      <Link
        href="/dashboard/orcamentos"
        className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 mb-4 transition-colors"
      >
        <ChevronLeft size={15} /> Voltar para orçamentos
      </Link>
      <h1 className="text-2xl font-bold text-slate-100 mb-6">Novo Orçamento</h1>
      <QuotationForm
        mode="create"
        initialData={{ clientId: initialClientId, visitId: initialVisitId }}
      />
    </div>
  )
}
