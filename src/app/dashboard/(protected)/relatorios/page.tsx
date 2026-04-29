'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { FileText, Plus, Filter, ChevronRight, Calendar, User, Clock } from 'lucide-react'

type ReportStatus = 'DRAFT' | 'FINALIZED' | 'SIGNED'

interface Report {
  id: string
  status: ReportStatus
  observations: string | null
  createdAt: string
  updatedAt: string
  visit: {
    scheduledAt: string
    realizedAt: string | null
    client: { id: string; name: string }
    technician: { id: string; name: string }
  }
  signature: { id: string; signerName: string; signedAt: string } | null
}

const STATUS_LABELS: Record<ReportStatus, string> = {
  DRAFT: 'Rascunho',
  FINALIZED: 'Finalizado',
  SIGNED: 'Assinado',
}

const STATUS_COLORS: Record<ReportStatus, string> = {
  DRAFT: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30',
  FINALIZED: 'bg-blue-500/10 text-blue-400 border border-blue-500/30',
  SIGNED: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30',
}

export default function RelatoriosPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')

  async function fetchReports() {
    setLoading(true)
    const params = new URLSearchParams()
    if (statusFilter) params.set('status', statusFilter)
    const res = await fetch(`/api/relatorios?${params.toString()}`)
    if (res.ok) {
      const data = await res.json()
      setReports(data)
    }
    setLoading(false)
  }

  useEffect(() => { fetchReports() }, [statusFilter])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <FileText className="w-6 h-6 text-cyan-500" />
            Relatórios
          </h1>
          <p className="text-slate-400 text-sm mt-1">Gerencie os relatórios de visitas técnicas</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 flex flex-wrap items-center gap-3">
        <Filter className="w-4 h-4 text-slate-400 shrink-0" />
        <div className="flex gap-2 flex-wrap">
          {(['', 'DRAFT', 'FINALIZED', 'SIGNED'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-2.5 min-h-[44px] rounded-md text-sm font-medium transition-colors ${
                statusFilter === s
                  ? 'bg-cyan-500 text-slate-950'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-100 border border-slate-700'
              }`}
            >
              {s === '' ? 'Todos' : STATUS_LABELS[s]}
            </button>
          ))}
        </div>
        <span className="ml-auto text-slate-400 text-sm">{reports.length} relatório(s)</span>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">Carregando...</div>
      ) : reports.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-400">Nenhum relatório encontrado</p>
          <p className="text-slate-500 text-sm mt-1">
            Relatórios são criados a partir de visitas realizadas
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {reports.map((report) => (
            <Link
              key={report.id}
              href={`/dashboard/relatorios/${report.id}`}
              className="bg-slate-900 border border-slate-700 rounded-lg p-4 hover:border-cyan-500/50 transition-colors group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[report.status]}`}>
                      {STATUS_LABELS[report.status]}
                    </span>
                    {report.signature && (
                      <span className="text-xs text-slate-500">
                        Assinado por {report.signature.signerName}
                      </span>
                    )}
                  </div>

                  <h3 className="text-slate-100 font-medium text-base truncate">
                    {report.visit.client.name}
                  </h3>

                  <div className="flex items-center gap-4 mt-2 flex-wrap">
                    <span className="flex items-center gap-1.5 text-slate-400 text-sm">
                      <User className="w-3.5 h-3.5" />
                      {report.visit.technician.name}
                    </span>
                    {report.visit.realizedAt && (
                      <span className="flex items-center gap-1.5 text-slate-400 text-sm">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(report.visit.realizedAt).toLocaleDateString('pt-BR')}
                      </span>
                    )}
                    <span className="flex items-center gap-1.5 text-slate-400 text-sm">
                      <Clock className="w-3.5 h-3.5" />
                      Atualizado em {new Date(report.updatedAt).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>

                <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-cyan-500 transition-colors shrink-0 mt-1" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
