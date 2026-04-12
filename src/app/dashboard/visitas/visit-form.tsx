'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MapPin } from 'lucide-react'
import { UpgradeModal } from '@/components/upgrade-modal'

type Client = { id: string; name: string; address?: string | null; city?: string | null; state?: string | null }
type Technician = { id: string; name: string }

type FormData = {
  clientId:     string
  technicianId: string
  scheduledAt:  string
  observations: string
}

type Props = {
  initialData?: Partial<FormData> & { id?: string }
  mode: 'create' | 'edit'
}

const inputClass = `
  w-full bg-slate-800 border border-slate-700 text-slate-100
  rounded-lg px-3 py-2.5 text-sm
  placeholder:text-slate-500
  focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500
  transition-colors
`

const labelClass = "block text-sm font-medium text-slate-300 mb-1.5"

export function VisitForm({ initialData, mode }: Props) {
  const router = useRouter()
  const [clients, setClients]               = useState<Client[]>([])
  const [technicians, setTechnicians]       = useState<Technician[]>([])
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [form, setForm] = useState<FormData>({
    clientId:     initialData?.clientId     || '',
    technicianId: initialData?.technicianId || '',
    scheduledAt:  initialData?.scheduledAt  || '',
    observations: initialData?.observations || '',
  })
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)
  const [upgradeModal, setUpgradeModal] = useState<{
    open: boolean; limit: number; current: number
  }>({ open: false, limit: 0, current: 0 })

  useEffect(() => {
    fetch('/api/clientes').then(r => r.json()).then(setClients)
    fetch('/api/usuarios').then(r => r.json()).then((users) =>
      setTechnicians(users.filter((u: any) => u.role !== 'READER'))
    )
  }, [])

  useEffect(() => {
    if (form.clientId) {
      const found = clients.find(c => c.id === form.clientId) || null
      setSelectedClient(found)
    } else {
      setSelectedClient(null)
    }
  }, [form.clientId, clients])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const url    = mode === 'create' ? '/api/visitas' : `/api/visitas/${initialData?.id}`
    const method = mode === 'create' ? 'POST' : 'PUT'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      if (data.error === 'LIMIT_REACHED') {
        setUpgradeModal({ open: true, limit: data.limit, current: data.current })
      } else {
        setError(data.error || 'Erro ao salvar')
      }
      return
    }

    router.push('/dashboard/visitas')
    router.refresh()
  }

  return (
    <div className="max-w-2xl">
      {/* Card container */}
      <div className="bg-slate-900 border border-slate-700/50 rounded-2xl p-6">
        <form onSubmit={handleSubmit} className="space-y-5">

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          {/* Cliente + Técnico */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Cliente *</label>
              <select
                value={form.clientId}
                onChange={e => setForm(f => ({ ...f, clientId: e.target.value }))}
                required
                className={inputClass}
              >
                <option value="" className="bg-slate-800">Selecione...</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id} className="bg-slate-800">{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>Técnico Responsável *</label>
              <select
                value={form.technicianId}
                onChange={e => setForm(f => ({ ...f, technicianId: e.target.value }))}
                required
                className={inputClass}
              >
                <option value="" className="bg-slate-800">Selecione...</option>
                {technicians.map(t => (
                  <option key={t.id} value={t.id} className="bg-slate-800">{t.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Endereço do cliente selecionado */}
          {selectedClient && (
            <div className="flex items-start gap-3 bg-slate-800/60 border border-slate-700 rounded-lg px-4 py-3">
              <MapPin size={15} className="text-cyan-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-slate-500 mb-0.5">Endereço do cliente</p>
                <p className="text-sm text-slate-300">
                  {[selectedClient.address, selectedClient.city, selectedClient.state]
                    .filter(Boolean).join(', ') || 'Endereço não cadastrado'}
                </p>
              </div>
            </div>
          )}

          {/* Data e Hora */}
          <div>
            <label className={labelClass}>Data e Hora *</label>
            <input
              type="datetime-local"
              value={form.scheduledAt}
              onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))}
              required
              className={inputClass + ' [color-scheme:dark]'}
            />
          </div>

          {/* Observações */}
          <div>
            <label className={labelClass}>Observações</label>
            <textarea
              value={form.observations}
              onChange={e => setForm(f => ({ ...f, observations: e.target.value }))}
              rows={4}
              placeholder="Descreva o objetivo da visita, equipamentos envolvidos..."
              className={inputClass}
            />
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={loading}
              className="bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-900 font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors"
            >
              {loading ? 'Salvando...' : mode === 'create' ? 'Agendar Visita' : 'Salvar Alterações'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="border border-slate-600 text-slate-300 hover:bg-slate-800 px-5 py-2.5 rounded-lg text-sm transition-colors"
            >
              Cancelar
            </button>
          </div>

        </form>
      </div>
      <UpgradeModal
        open={upgradeModal.open}
        onClose={() => setUpgradeModal((m) => ({ ...m, open: false }))}
        resource="visits"
        limit={upgradeModal.limit}
        current={upgradeModal.current}
      />
    </div>
  )
}
