'use client'

import Link from 'next/link'
import { Calendar, MapPin, User, Building2 } from 'lucide-react'

type Visit = {
  id: string
  scheduledAt: string
  status: 'SCHEDULED' | 'REALIZED' | 'NOT_REALIZED'
  observations?: string | null
  client: { id: string; name: string; address?: string | null; city?: string | null; state?: string | null }
  technician: { id: string; name: string }
}

const statusConfig = {
  SCHEDULED:    { label: 'Agendada',      color: 'bg-blue-500/15 text-blue-400' },
  REALIZED:     { label: 'Realizada',     color: 'bg-green-500/15 text-green-400' },
  NOT_REALIZED: { label: 'Não Realizada', color: 'bg-red-500/15 text-red-400' },
}

export function VisitCard({ visit }: { visit: Visit }) {
  const cfg  = statusConfig[visit.status]
  const date = new Date(visit.scheduledAt)

  const location = [visit.client.city, visit.client.state].filter(Boolean).join(' / ')

  return (
    <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5 hover:bg-slate-800 hover:border-slate-600 transition-all">
      <div className="flex items-start justify-between mb-3">
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.color}`}>
          {cfg.label}
        </span>
        <span className="text-xs text-slate-500">
          {date.toLocaleDateString('pt-BR')}{' '}
          {date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      {visit.observations && (
        <p className="text-sm font-medium text-slate-200 mb-3 line-clamp-2">
          {visit.observations}
        </p>
      )}

      <div className="space-y-1.5 text-sm text-slate-400">
        <div className="flex items-center gap-2">
          <Building2 size={14} className="text-slate-500" />
          <span>{visit.client.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <User size={14} className="text-slate-500" />
          <span>{visit.technician.name}</span>
        </div>
        {location && (
          <div className="flex items-center gap-2">
            <MapPin size={14} className="text-slate-500" />
            <span>{location}</span>
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-700/60">
        <Link
          href={`/dashboard/visitas/${visit.id}`}
          className="text-sm text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
        >
          Ver detalhes →
        </Link>
      </div>
    </div>
  )
}