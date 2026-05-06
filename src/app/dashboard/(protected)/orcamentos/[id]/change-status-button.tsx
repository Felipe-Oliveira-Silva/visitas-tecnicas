'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Send, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { QuotationStatus } from '@prisma/client'

type Props = {
  quotationId:   string
  currentStatus: QuotationStatus
  userRole:      string
}

export function ChangeStatusButton({ quotationId, currentStatus, userRole }: Props) {
  const router              = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const isAdminOrSuper = userRole === 'ADMIN' || userRole === 'SUPERADMIN'

  async function transition(newStatus: 'SENT' | 'APPROVED' | 'REJECTED') {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/quotations/${quotationId}/status`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) {
        const text = await res.text()
        const msg  = text
          ? (() => { try { return JSON.parse(text).error } catch { return text } })()
          : `Erro ${res.status}`
        setError(msg || 'Erro ao atualizar status')
        return
      }
      router.refresh()
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  if (currentStatus === 'DRAFT') {
    return (
      <div className="flex flex-wrap gap-2">
        {error && <p className="w-full text-sm text-red-400">{error}</p>}
        <button
          onClick={() => transition('SENT')}
          disabled={loading}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-3 min-h-[44px] rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          Marcar como Enviado
        </button>
      </div>
    )
  }

  if (currentStatus === 'SENT' && isAdminOrSuper) {
    return (
      <div className="flex flex-wrap gap-2">
        {error && <p className="w-full text-sm text-red-400">{error}</p>}
        <button
          onClick={() => transition('APPROVED')}
          disabled={loading}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-3 min-h-[44px] rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
          Aprovar
        </button>
        <button
          onClick={() => transition('REJECTED')}
          disabled={loading}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white px-4 py-3 min-h-[44px] rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
          Rejeitar
        </button>
      </div>
    )
  }

  return null
}
