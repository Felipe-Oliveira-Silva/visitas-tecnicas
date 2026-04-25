'use client'

import { useState } from 'react'

interface GerarPdfButtonProps {
  reportId: string
  hasPdf: boolean
  status: string
}

export function GerarPdfButton({ reportId, hasPdf, status }: GerarPdfButtonProps) {
  const [loading, setLoading] = useState(false)
  const [pdfReady, setPdfReady] = useState<boolean>(hasPdf)
  const [error, setError] = useState<string | null>(null)

  if (status === 'DRAFT') return null

  async function handleGerar() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/relatorios/${reportId}/gerar-pdf`, {
        method: 'POST',
      })
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
      <div className="flex gap-2">
        <button
          onClick={handleGerar}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Gerando PDF...
            </>
          ) : pdfReady ? (
            'Regenerar PDF'
          ) : (
            'Gerar PDF'
          )}
        </button>

        {pdfReady && (
          <a
            href={`/api/relatorios/${reportId}/pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-slate-700 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Baixar PDF
          </a>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}
    </div>
  )
}