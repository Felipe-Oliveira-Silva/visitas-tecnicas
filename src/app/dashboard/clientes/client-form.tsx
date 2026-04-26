'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Save, Loader2 } from 'lucide-react'

type ClientFormProps = {
  mode: 'create' | 'edit'
  clientId?: string
  defaultValues?: {
    name?: string
    cnpj?: string
    email?: string
    phone?: string
    address?: string
    city?: string
    state?: string
    notes?: string
  }
}

const ESTADOS_BR = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS',
  'MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC',
  'SP','SE','TO',
]

export function ClientForm({ mode, clientId, defaultValues }: ClientFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    name: defaultValues?.name ?? '',
    cnpj: defaultValues?.cnpj ?? '',
    email: defaultValues?.email ?? '',
    phone: defaultValues?.phone ?? '',
    address: defaultValues?.address ?? '',
    city: defaultValues?.city ?? '',
    state: defaultValues?.state ?? '',
    notes: defaultValues?.notes ?? '',
  })

  const set = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const url = mode === 'create' ? '/api/clientes' : `/api/clientes/${clientId}`
    const method = mode === 'create' ? 'POST' : 'PUT'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    if (res.ok) {
      router.push('/dashboard/clientes')
      router.refresh()
    } else {
      const data = await res.json()
      setError(data.error ?? 'Erro ao salvar cliente')
    }

    setLoading(false)
  }

  const inputClass = "w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 transition-colors"
  const labelClass = "text-sm font-medium text-slate-300"

  return (
    <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-700/50 rounded-2xl p-6 space-y-5 max-w-2xl">
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Nome + Documento */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className={labelClass}>Razão Social / Nome *</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            required
            placeholder="Empresa Exemplo Ltda"
            className={inputClass}
          />
        </div>
        <div className="space-y-1.5">
          <label className={labelClass}>CNPJ / CPF</label>
          <input
            type="text"
            value={form.cnpj}
            onChange={(e) => set('cnpj', e.target.value)}
            placeholder="00.000.000/0001-00"
            className={inputClass}
          />
        </div>
      </div>

      {/* Email + Telefone */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className={labelClass}>E-mail</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => set('email', e.target.value)}
            placeholder="contato@empresa.com"
            className={inputClass}
          />
        </div>
        <div className="space-y-1.5">
          <label className={labelClass}>Telefone</label>
          <input
            type="text"
            value={form.phone}
            onChange={(e) => set('phone', e.target.value)}
            placeholder="(11) 99999-9999"
            className={inputClass}
          />
        </div>
      </div>

      {/* Endereço */}
      <div className="space-y-1.5">
        <label className={labelClass}>Endereço</label>
        <input
          type="text"
          value={form.address}
          onChange={(e) => set('address', e.target.value)}
          placeholder="Rua Exemplo, 100 - Bairro"
          className={inputClass}
        />
      </div>

      {/* Cidade + Estado */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className={labelClass}>Cidade</label>
          <input
            type="text"
            value={form.city}
            onChange={(e) => set('city', e.target.value)}
            placeholder="São Paulo"
            className={inputClass}
          />
        </div>
        <div className="space-y-1.5">
          <label className={labelClass}>Estado</label>
          <select
            value={form.state}
            onChange={(e) => set('state', e.target.value)}
            className={inputClass}
          >
            <option value="">Selecione...</option>
            {ESTADOS_BR.map((uf) => (
              <option key={uf} value={uf}>{uf}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Observações */}
      <div className="space-y-1.5">
        <label className={labelClass}>Observações</label>
        <textarea
          value={form.notes}
          onChange={(e) => set('notes', e.target.value)}
          rows={3}
          placeholder="Informações adicionais sobre o cliente..."
          className={`${inputClass} resize-none`}
        />
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-60 text-slate-900 font-semibold rounded-xl transition-colors text-sm"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {mode === 'create' ? 'Cadastrar Cliente' : 'Salvar Alterações'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors text-sm"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}
