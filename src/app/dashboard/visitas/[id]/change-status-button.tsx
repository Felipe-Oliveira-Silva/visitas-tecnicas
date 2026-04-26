'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'

export function ChangeStatusButton({ visitId, currentStatus }: { 
  visitId: string
  currentStatus: 'SCHEDULED' | 'REALIZED' | 'NOT_REALIZED'
}) {
  const router = useRouter()
  const [loading, setLoading]     = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [newStatus, setNewStatus] = useState<'REALIZED' | 'NOT_REALIZED' | null>(null)
  const [note, setNote]           = useState('')
  const [reason, setReason]       = useState('')
  const [error, setError]         = useState('')

async function handleConfirm() {
  if (!newStatus) return
  setLoading(true)
  setError('')

  let res: Response
  try {
    res = await fetch(`/api/visitas/${visitId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status:            newStatus,
        statusNote:        note || undefined,
        notRealizedReason: newStatus === 'NOT_REALIZED' ? reason : undefined,
      }),
    })
  } catch {
    setError('Erro de conexão. Tente novamente.')
    setLoading(false)
    return
  }

  if (!res.ok) {
    // corpo pode vir vazio em erros 500
    const text = await res.text()
    const msg = text
      ? (() => { try { return JSON.parse(text).error } catch { return text } })()
      : `Erro ${res.status} no servidor`
    setError(msg || 'Erro ao atualizar status')
    setLoading(false)
    return
  }

  setLoading(false)
  setShowModal(false)
  router.refresh()
}

  function openModal(status: 'REALIZED' | 'NOT_REALIZED') {
    setNewStatus(status)
    setNote('')
    setReason('')
    setError('')
    setShowModal(true)
  }

  // Visita já concluída — não exibe botões
  if (currentStatus !== 'SCHEDULED') return null

  return (
    <>
      <div className="flex gap-2">
        <button
          onClick={() => openModal('REALIZED')}
          className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-emerald-500 transition-colors font-medium"
        >
          <CheckCircle size={14} />
          Marcar Realizada
        </button>
        <button
          onClick={() => openModal('NOT_REALIZED')}
          className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-500 transition-colors font-medium"
        >
          <XCircle size={14} />
          Não Realizada
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-6 w-full max-w-md">
            <h2 className="text-slate-100 text-lg font-semibold mb-1">
              {newStatus === 'REALIZED' ? 'Confirmar Realização' : 'Registrar Não Realização'}
            </h2>
            <p className="text-slate-400 text-sm mb-5">
              {newStatus === 'REALIZED'
                ? 'A visita será marcada como realizada agora.'
                : 'Informe o motivo pelo qual a visita não foi realizada.'}
            </p>

            {newStatus === 'NOT_REALIZED' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Motivo <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="Ex: cliente ausente, acesso negado..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-sm"
                />
              </div>
            )}

            <div className="mb-5">
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Observação <span className="text-slate-500">(opcional)</span>
              </label>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                rows={3}
                placeholder="Detalhes adicionais sobre a visita..."
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-sm resize-none"
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm mb-4">{error}</p>
            )}

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowModal(false)}
                disabled={loading}
                className="px-4 py-2 bg-slate-800 text-slate-100 rounded-lg text-sm border border-slate-700 hover:border-slate-500 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirm}
                disabled={loading || (newStatus === 'NOT_REALIZED' && !reason.trim())}
                className="flex items-center gap-2 px-4 py-2 bg-cyan-500 text-slate-950 rounded-lg text-sm font-semibold disabled:opacity-50 hover:bg-cyan-400 transition-colors"
              >
                {loading && <Loader2 size={14} className="animate-spin" />}
                {loading ? 'Salvando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}