import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkVisitLimit } from '@/lib/plan-limits'
import Link from 'next/link'
import { VisitCard } from './visit-card'
import { Plus, CalendarX } from 'lucide-react'

type SearchParams = { status?: string; clientId?: string; technicianId?: string }

const selectClass = `
  bg-slate-800 border border-slate-700 text-slate-300
  rounded-lg px-3 py-2 text-sm
  focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500
  transition-colors [color-scheme:dark]
`

export default async function VisitasPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await auth()
  if (!session) return null

  const { status, clientId, technicianId } = searchParams

  const [visitCheck, visits, clients, technicians] = await Promise.all([
    checkVisitLimit(session.user.companyId),
    prisma.visit.findMany({
      where: {
        companyId: session.user.companyId,
        ...(status       && { status: status as any }),
        ...(clientId     && { clientId }),
        ...(technicianId && { technicianId }),
      },
      include: {
        client:     { select: { id: true, name: true, address: true, city: true, state: true } },
        technician: { select: { id: true, name: true } },
      },
      orderBy: { scheduledAt: 'asc' },
    }),
    prisma.client.findMany({
      where:   { companyId: session.user.companyId, active: true },
      select:  { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
    prisma.user.findMany({
      where:   { companyId: session.user.companyId, active: true, role: { not: 'READER' } },
      select:  { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ])

  const canCreate = session.user.role !== 'READER'
  const atLimit = !visitCheck.allowed
  const hasFilters = status || clientId || technicianId

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Visitas</h1>
          <p className="text-sm text-slate-400 mt-1">
            {visits.length} visita{visits.length !== 1 ? 's' : ''} encontrada{visits.length !== 1 ? 's' : ''}
          </p>
        </div>
        {canCreate && (
          atLimit ? (
            <button
              disabled
              title="Limite do plano atingido"
              className="flex items-center gap-2 bg-slate-700 text-slate-500 font-semibold px-4 py-2.5 rounded-lg text-sm cursor-not-allowed"
            >
              <Plus size={16} /> Agendar Visita
            </button>
          ) : (
            <Link
              href="/dashboard/visitas/novo"
              className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-semibold px-4 py-2.5 rounded-lg text-sm transition-colors"
            >
              <Plus size={16} /> Agendar Visita
            </Link>
          )
        )}
      </div>

      {/* Filtros */}
      <form method="GET" className="flex flex-wrap gap-3 mb-6">
        <select name="status" defaultValue={status || ''} className={selectClass}>
          <option value="" className="bg-slate-800">Todos os status</option>
          <option value="SCHEDULED" className="bg-slate-800">Agendada</option>
          <option value="REALIZED" className="bg-slate-800">Realizada</option>
          <option value="NOT_REALIZED" className="bg-slate-800">Não Realizada</option>
        </select>

        <select name="clientId" defaultValue={clientId || ''} className={selectClass}>
          <option value="" className="bg-slate-800">Todos os clientes</option>
          {clients.map(c => (
            <option key={c.id} value={c.id} className="bg-slate-800">{c.name}</option>
          ))}
        </select>

        <select name="technicianId" defaultValue={technicianId || ''} className={selectClass}>
          <option value="" className="bg-slate-800">Todos os técnicos</option>
          {technicians.map(t => (
            <option key={t.id} value={t.id} className="bg-slate-800">{t.name}</option>
          ))}
        </select>

        <button
          type="submit"
          className="bg-slate-700 hover:bg-slate-600 text-slate-100 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          Filtrar
        </button>

        {hasFilters && (
          <Link
            href="/dashboard/visitas"
            className="border border-slate-600 text-slate-400 hover:text-slate-200 hover:border-slate-500 px-4 py-2 rounded-lg text-sm transition-colors"
          >
            Limpar filtros
          </Link>
        )}
      </form>

      {/* Conteúdo */}
      {visits.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mb-4">
            <CalendarX size={24} className="text-slate-500" />
          </div>
          <p className="text-slate-300 font-medium text-lg">Nenhuma visita encontrada</p>
          <p className="text-slate-500 text-sm mt-1 mb-5">
            {hasFilters ? 'Tente ajustar os filtros acima.' : 'Agende a primeira visita para começar.'}
          </p>
          {canCreate && !hasFilters && !atLimit && (
            <Link
              href="/dashboard/visitas/novo"
              className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors"
            >
              <Plus size={15} /> Agendar primeira visita
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {visits.map(v => <VisitCard key={v.id} visit={v as any} />)}
        </div>
      )}
    </div>
  )
}
