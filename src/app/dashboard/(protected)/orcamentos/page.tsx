import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { QuotationCard } from './quotation-card'
import { Plus, Receipt } from 'lucide-react'
import { Prisma, QuotationStatus } from '@prisma/client'

type SearchParams = { status?: string; search?: string }

const selectClass = `
  w-full sm:w-auto
  bg-slate-800 border border-slate-700 text-slate-300
  rounded-lg px-3 py-3 min-h-[44px] text-sm
  focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500
  transition-colors [color-scheme:dark]
`

export default async function OrcamentosPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await auth()
  if (!session) return null

  const { status, search } = searchParams

  const where: Prisma.QuotationWhereInput = {
    companyId: session.user.companyId,
  }

  const validStatuses = Object.values(QuotationStatus) as string[]
  if (status && validStatuses.includes(status)) {
    where.status = status as QuotationStatus
  }

  if (search) {
    where.OR = [
      { title:  { contains: search, mode: 'insensitive' } },
      { client: { name: { contains: search, mode: 'insensitive' } } },
    ]
  }

  const quotations = await prisma.quotation.findMany({
    where,
    include: {
      client: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const canCreate = session.user.role !== 'READER'
  const hasFilters = status || search

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Orçamentos</h1>
          <p className="text-sm text-slate-400 mt-1">
            {quotations.length} orçamento{quotations.length !== 1 ? 's' : ''} encontrado{quotations.length !== 1 ? 's' : ''}
          </p>
        </div>
        {canCreate && (
          <Link
            href="/dashboard/orcamentos/novo"
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold px-4 py-3 min-h-[44px] rounded-lg text-sm transition-colors"
          >
            <Plus size={16} /> Novo Orçamento
          </Link>
        )}
      </div>

      {/* Filtros */}
      <form method="GET" className="flex flex-wrap gap-3 mb-6">
        <input
          name="search"
          type="search"
          defaultValue={search ?? ''}
          placeholder="Buscar por título ou cliente..."
          className="w-full sm:w-64 bg-slate-800 border border-slate-700 text-slate-300 rounded-lg px-3 py-3 min-h-[44px] text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors placeholder-slate-500"
        />
        <select name="status" defaultValue={status ?? ''} className={selectClass}>
          <option value="" className="bg-slate-800">Todos os status</option>
          <option value="DRAFT"    className="bg-slate-800">Rascunho</option>
          <option value="SENT"     className="bg-slate-800">Enviado</option>
          <option value="APPROVED" className="bg-slate-800">Aprovado</option>
          <option value="REJECTED" className="bg-slate-800">Rejeitado</option>
        </select>
        <button
          type="submit"
          className="bg-slate-700 hover:bg-slate-600 text-slate-100 px-4 py-3 min-h-[44px] rounded-lg text-sm font-medium transition-colors"
        >
          Filtrar
        </button>
        {hasFilters && (
          <Link
            href="/dashboard/orcamentos"
            className="border border-slate-600 text-slate-400 hover:text-slate-200 hover:border-slate-500 px-4 py-3 min-h-[44px] rounded-lg text-sm transition-colors"
          >
            Limpar filtros
          </Link>
        )}
      </form>

      {/* Conteúdo */}
      {quotations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mb-4">
            <Receipt size={24} className="text-slate-500" />
          </div>
          <p className="text-slate-300 font-medium text-lg">Nenhum orçamento encontrado</p>
          <p className="text-slate-500 text-sm mt-1 mb-5">
            {hasFilters ? 'Tente ajustar os filtros acima.' : 'Crie o primeiro orçamento para começar.'}
          </p>
          {canCreate && !hasFilters && (
            <Link
              href="/dashboard/orcamentos/novo"
              className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors"
            >
              <Plus size={15} /> Criar primeiro orçamento
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {quotations.map(q => (
            <QuotationCard
              key={q.id}
              quotation={{
                id:         q.id,
                title:      q.title,
                status:     q.status,
                total:      q.total.toNumber(),
                client:     q.client,
                createdAt:  q.createdAt,
                validUntil: q.validUntil,
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
