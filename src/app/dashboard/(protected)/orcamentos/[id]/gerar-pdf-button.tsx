'use client'

import { useState } from 'react'
import { FileText, Download, Loader2 } from 'lucide-react'

interface GerarPdfButtonProps {
  quotationId: string
  hasPdf:      boolean
}

export function GerarPdfButton({ quotationId, hasPdf }: GerarPdfButtonProps) {
  const [loading, setLoading]   = useState(false)
  const [pdfReady, setPdfReady] = useState(hasPdf)
  const [error, setError]       = useState<string | null>(null)

  async function handleGerar() {
    setLoading(true)
    setError(null)
    try {
      const res  = await fetch(`/api/quotations/${quotationId}/gerar-pdf`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Erro ao gerar PDF')
        return
      }
      setPdfReady(true)
    } catch {
      setError('Erro ao conectar com o servidor')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleGerar}
          disabled={loading}
          className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-3 min-h-[44px] rounded-lg text-sm font-medium transition-colors"
        >
          {loading
            ? <Loader2 size={15} className="animate-spin" />
            : <FileText size={15} />
          }
          {loading ? 'Gerando PDF...' : pdfReady ? 'Regenerar PDF' : 'Gerar PDF'}
        </button>

        {pdfReady && (
          <a
            href={`/api/quotations/${quotationId}/pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-100 px-4 py-3 min-h-[44px] rounded-lg text-sm font-medium transition-colors"
          >
            <Download size={15} />
            Baixar PDF
          </a>
        )}
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  )
}
