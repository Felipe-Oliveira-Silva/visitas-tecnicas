'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, Loader2, AlertCircle } from 'lucide-react'

interface GenerateReportButtonProps {
  visitId: string
  existingReportId?: string | null
}

export default function GenerateReportButton({ visitId, existingReportId }: GenerateReportButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Se já existe relatório, redireciona direto
  if (existingReportId) {
    return (
      <button
        onClick={() => router.push(`/dashboard/relatorios/${existingReportId}`)}
        className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-slate-100 rounded-lg border border-slate-700 hover:border-cyan-500/50 transition-colors text-sm font-medium"
      >
        <FileText className="w-4 h-4 text-cyan-500" />
        Ver Relatório
      </button>
    )
  }

  async function handleGenerate() {
    setLoading(true)
    setError('')

    const res = await fetch('/api/relatorios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visitId }),
    })

    if (res.ok) {
      const report = await res.json()
      router.push(`/dashboard/relatorios/${report.id}`)
    } else {
      const data = await res.json()
      setError(data.error || 'Erro ao gerar relatório')
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 bg-cyan-500 text-slate-950 rounded-lg hover:bg-cyan-400 transition-colors text-sm font-semibold disabled:opacity-50"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
        Gerar Relatório
      </button>
      {error && (
        <div className="flex items-center gap-1.5 text-red-400 text-xs">
          <AlertCircle className="w-3.5 h-3.5" />
          {error}
        </div>
      )}
    </div>
  )
}
