import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Calendar, MapPin, User, Building2, Clock, Pencil } from 'lucide-react'
import { ChangeStatusButton } from './change-status-button'
import GenerateReportButton from './generate-report-button'

const statusConfig = {
  SCHEDULED:    { label: 'Agendada',      color: 'bg-blue-500/10 text-blue-400 border border-blue-500/30' },
  REALIZED:     { label: 'Realizada',     color: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' },
  NOT_REALIZED: { label: 'Não Realizada', color: 'bg-red-500/10 text-red-400 border border-red-500/30' },
}

export default async function VisitaDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params  // ← linha nova
  const session = await auth()
  if (!session) return null

  const visit = await prisma.visit.findFirst({
    where: { id, companyId: session.user.companyId },  // ← params.id → id
    include: {
      client:     { select: { id: true, name: true, address: true, city: true, state: true } },
      technician: { select: { id: true, name: true } },
      statusHistory: {
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
      },
      report: { select: { id: true } },
    },
  })

  if (!visit) notFound()

  const cfg      = statusConfig[visit.status]
  const canEdit  = session.user.role !== 'READER'
  const date     = new Date(visit.scheduledAt)
  const location = [visit.client.address, visit.client.city, visit.client.state].filter(Boolean).join(', ')

  return (
    <div className="max-w-3xl space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link href="/dashboard/visitas" className="text-sm text-slate-400 hover:text-slate-100 transition-colors mb-1 inline-block py-2">
            ← Voltar para visitas
          </Link>
          <h1 className="text-2xl font-bold text-slate-100">
            Visita — {visit.client.name}
          </h1>
        </div>
        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${cfg.color}`}>
          {cfg.label}
        </span>
      </div>

      {/* Informações */}
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <Building2 size={18} className="text-slate-500" />
            <div>
              <p className="text-xs text-slate-500">Cliente</p>
              <p className="text-sm font-medium text-slate-100">{visit.client.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <User size={18} className="text-slate-500" />
            <div>
              <p className="text-xs text-slate-500">Técnico</p>
              <p className="text-sm font-medium text-slate-100">{visit.technician.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Calendar size={18} className="text-slate-500" />
            <div>
              <p className="text-xs text-slate-500">Data / Hora Agendada</p>
              <p className="text-sm font-medium text-slate-100">
                {date.toLocaleDateString('pt-BR')} às{' '}
                {date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
          {visit.realizedAt && (
            <div className="flex items-center gap-3">
              <Calendar size={18} className="text-emerald-500" />
              <div>
                <p className="text-xs text-slate-500">Data / Hora Realizada</p>
                <p className="text-sm font-medium text-slate-100">
                  {new Date(visit.realizedAt).toLocaleDateString('pt-BR')} às{' '}
                  {new Date(visit.realizedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          )}
          {location && (
            <div className="flex items-center gap-3 md:col-span-2">
              <MapPin size={18} className="text-slate-500" />
              <div>
                <p className="text-xs text-slate-500">Endereço do Cliente</p>
                <p className="text-sm font-medium text-slate-100">{location}</p>
              </div>
            </div>
          )}
        </div>

        {visit.notRealizedReason && (
          <div className="pt-4 border-t border-slate-700">
            <p className="text-xs text-red-400 mb-1">Motivo da Não Realização</p>
            <p className="text-sm text-slate-300">{visit.notRealizedReason}</p>
          </div>
        )}

        {visit.observations && (
          <div className="pt-4 border-t border-slate-700">
            <p className="text-xs text-slate-500 mb-1">Observações</p>
            <p className="text-sm text-slate-300 whitespace-pre-wrap">{visit.observations}</p>
          </div>
        )}
      </div>

      {/* Ações */}
      {canEdit && (
        <div className="flex flex-wrap gap-3">
          {/* currentStatus agora é passado corretamente ↓ */}
          <ChangeStatusButton visitId={visit.id} currentStatus={visit.status} />
          <Link
            href={`/dashboard/visitas/${visit.id}/editar`}
            className="flex items-center gap-2 border border-slate-700 text-slate-100 px-4 py-3 min-h-[44px] rounded-lg text-sm hover:border-slate-500 transition-colors"
          >
            <Pencil size={14} /> Editar
          </Link>
          {/* JSX órfão removido — GenerateReportButton já tem o ícone interno ↓ */}
          {visit.status === 'REALIZED' && (
            <GenerateReportButton
              visitId={visit.id}
              existingReportId={visit.report?.id ?? null}
            />
          )}
        </div>
      )}

      {/* Histórico */}
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-slate-100 mb-4 flex items-center gap-2">
          <Clock size={16} className="text-cyan-500" /> Histórico de Alterações
        </h2>
        {visit.statusHistory.length === 0 ? (
          <p className="text-sm text-slate-400">Sem histórico registrado</p>
        ) : (
          <ul className="space-y-3">
            {visit.statusHistory.map((h) => {
              const hCfg = statusConfig[h.status as keyof typeof statusConfig]
              return (
                <li key={h.id} className="flex items-start gap-3 text-sm">
                  <span className={`mt-0.5 text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${hCfg.color}`}>
                    {hCfg.label}
                  </span>
                  <div>
                    <span className="text-slate-400">
                      por <strong className="text-slate-200">{h.user.name}</strong>
                    </span>
                    {h.note && <span className="text-slate-500"> — {h.note}</span>}
                    <p className="text-xs text-slate-500 mt-0.5">
                      {new Date(h.createdAt).toLocaleString('pt-BR')}
                    </p>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}