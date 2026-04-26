'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Loader2, Plus, Trash2, AlertCircle } from 'lucide-react'

interface ChecklistItem {
  key: string
  value: boolean
}

interface MeasurementItem {
  key: string
  value: string
}

export default function EditarRelatorioPage() {
  const params = useParams()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [observations, setObservations] = useState('')
  const [checklist, setChecklist] = useState<ChecklistItem[]>([])
  const [measurements, setMeasurements] = useState<MeasurementItem[]>([])

  useEffect(() => {
    fetch(`/api/relatorios/${params.id}`)
      .then(r => r.json())
      .then(data => {
        if (data.status && data.status !== 'DRAFT') {
          router.replace(`/dashboard/relatorios/${params.id}`)
          return
        }
        setObservations(data.observations || '')
        if (data.checklistData) {
          setChecklist(Object.entries(data.checklistData).map(([key, value]) => ({ key, value: value as boolean })))
        }
        if (data.measurementData) {
          setMeasurements(Object.entries(data.measurementData).map(([key, value]) => ({ key, value: String(value) })))
        }
        setLoading(false)
      })
  }, [])

  function toChecklistJson() {
    return Object.fromEntries(checklist.filter(i => i.key.trim()).map(i => [i.key.trim(), i.value]))
  }

  function toMeasurementJson() {
    return Object.fromEntries(measurements.filter(i => i.key.trim()).map(i => [i.key.trim(), i.value]))
  }

  async function handleSave() {
    setSaving(true)
    setError('')
    const res = await fetch(`/api/relatorios/${params.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        observations: observations || undefined,
        checklistData: checklist.length > 0 ? toChecklistJson() : null,
        measurementData: measurements.length > 0 ? toMeasurementJson() : null,
      }),
    })
    if (res.ok) {
      router.push(`/dashboard/relatorios/${params.id}`)
    } else {
      const data = await res.json()
      setError(data.error || 'Erro ao salvar')
      setSaving(false)
    }
  }

  function addChecklist() {
    setChecklist(prev => [...prev, { key: '', value: false }])
  }

  function removeChecklist(idx: number) {
    setChecklist(prev => prev.filter((_, i) => i !== idx))
  }

  function addMeasurement() {
    setMeasurements(prev => [...prev, { key: '', value: '' }])
  }

  function removeMeasurement(idx: number) {
    setMeasurements(prev => prev.filter((_, i) => i !== idx))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-cyan-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href={`/dashboard/relatorios/${params.id}`}
          className="text-slate-400 hover:text-slate-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Editar Relatório</h1>
          <p className="text-slate-400 text-sm">Apenas relatórios em rascunho podem ser editados</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Observações */}
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-5 space-y-3">
        <h2 className="text-slate-100 font-semibold">Observações</h2>
        <textarea
          value={observations}
          onChange={e => setObservations(e.target.value)}
          rows={5}
          placeholder="Descreva as observações do relatório..."
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-sm resize-none"
        />
      </div>

      {/* Checklist */}
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-slate-100 font-semibold">Checklist</h2>
          <button
            onClick={addChecklist}
            className="flex items-center gap-1.5 text-sm text-cyan-500 hover:text-cyan-400 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Adicionar item
          </button>
        </div>

        {checklist.length === 0 && (
          <p className="text-slate-500 text-sm">Nenhum item de checklist. Clique em "Adicionar item" para começar.</p>
        )}

        <div className="space-y-2">
          {checklist.map((item, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={item.value}
                onChange={e => {
                  const updated = [...checklist]
                  updated[idx].value = e.target.checked
                  setChecklist(updated)
                }}
                className="w-4 h-4 accent-cyan-500 shrink-0"
              />
              <input
                type="text"
                value={item.key}
                onChange={e => {
                  const updated = [...checklist]
                  updated[idx].key = e.target.value
                  setChecklist(updated)
                }}
                placeholder="Descrição do item"
                className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-sm"
              />
              <button
                onClick={() => removeChecklist(idx)}
                className="text-slate-500 hover:text-red-400 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Medições */}
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-slate-100 font-semibold">Medições</h2>
          <button
            onClick={addMeasurement}
            className="flex items-center gap-1.5 text-sm text-cyan-500 hover:text-cyan-400 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Adicionar medição
          </button>
        </div>

        {measurements.length === 0 && (
          <p className="text-slate-500 text-sm">Nenhuma medição registrada. Clique em "Adicionar medição" para começar.</p>
        )}

        <div className="space-y-2">
          {measurements.map((item, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <input
                type="text"
                value={item.key}
                onChange={e => {
                  const updated = [...measurements]
                  updated[idx].key = e.target.value
                  setMeasurements(updated)
                }}
                placeholder="Nome da medição (ex: Tensão)"
                className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-sm"
              />
              <input
                type="text"
                value={item.value}
                onChange={e => {
                  const updated = [...measurements]
                  updated[idx].value = e.target.value
                  setMeasurements(updated)
                }}
                placeholder="Valor (ex: 220V)"
                className="w-36 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-sm"
              />
              <button
                onClick={() => removeMeasurement(idx)}
                className="text-slate-500 hover:text-red-400 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Ações */}
      <div className="flex justify-end gap-3">
        <Link
          href={`/dashboard/relatorios/${params.id}`}
          className="px-4 py-2 bg-slate-800 text-slate-100 rounded-lg border border-slate-700 hover:border-slate-500 transition-colors text-sm font-medium"
        >
          Cancelar
        </Link>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-cyan-500 text-slate-950 rounded-lg hover:bg-cyan-400 transition-colors text-sm font-semibold disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Salvar alterações
        </button>
      </div>
    </div>
  )
}
