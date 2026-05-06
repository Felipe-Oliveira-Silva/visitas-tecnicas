import Link from 'next/link'
import { Calendar } from 'lucide-react'
import { QuotationStatus } from '@prisma/client'

const statusConfig: Record<QuotationStatus, { label: string; color: string }> = {
  DRAFT:    { label: 'Rascunho', color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' },
  SENT:     { label: 'Enviado',  color: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
  APPROVED: { label: 'Aprovado', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
  REJECTED: { label: 'Rejeitado', color: 'bg-red-500/10 text-red-400 border-red-500/30' },
}

const fmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

type QuotationCardProps = {
  quotation: {
    id:         string
    title:      string
    status:     QuotationStatus
    total:      number
    client:     { name: string }
    createdAt:  Date
    validUntil: Date | null
  }
}

export function QuotationCard({ quotation: q }: QuotationCardProps) {
  const cfg     = statusConfig[q.status]
  const orcCode = `ORC-${q.id.slice(-6).toUpperCase()}`

  return (
    <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5 hover:bg-slate-800 hover:border-slate-600 transition-all">
      <div className="flex items-start justify-between mb-3">
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${cfg.color}`}>
          {cfg.label}
        </span>
        <span className="text-xs text-slate-500 font-mono">{orcCode}</span>
      </div>

      <p className="text-sm font-semibold text-slate-100 mb-1 line-clamp-2">{q.title}</p>
      <p className="text-xs text-slate-400 mb-3">{q.client.name}</p>

      <div className="flex items-center justify-between mb-4">
        <span className="text-lg font-bold text-amber-400">{fmt.format(q.total)}</span>
        {q.validUntil && (
          <span className="flex items-center gap-1 text-xs text-slate-500">
            <Calendar size={12} />
            Válido até {new Date(q.validUntil).toLocaleDateString('pt-BR')}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-slate-700/60">
        <span className="text-xs text-slate-500">
          {new Date(q.createdAt).toLocaleDateString('pt-BR')}
        </span>
        <Link
          href={`/dashboard/orcamentos/${q.id}`}
          className="text-sm text-amber-400 hover:text-amber-300 font-medium transition-colors"
        >
          Ver detalhes →
        </Link>
      </div>
    </div>
  )
}
