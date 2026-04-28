'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useState } from 'react'
import { Pencil, MapPin, Mail, Phone, ToggleLeft, ToggleRight } from 'lucide-react'

type Client = {
  id: string
  name: string
  cnpj?: string | null
  email?: string | null
  phone?: string | null
  city?: string | null
  state?: string | null
  active: boolean
}

export function ClientCard({ client, canEdit }: { client: Client; canEdit: boolean }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const toggleActive = async () => {
    setLoading(true)
    await fetch(`/api/clientes/${client.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !client.active }),
    })
    router.refresh()
    setLoading(false)
  }

  const initials = client.name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div
      className={`bg-slate-900 border rounded-2xl px-5 py-4 flex items-center gap-4 transition-colors ${
        client.active ? 'border-slate-700/50 hover:border-slate-600' : 'border-slate-800 opacity-60'
      }`}
    >
      {/* Avatar */}
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
        {initials}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-white font-medium truncate">{client.name}</p>
          {client.cnpj && (
            <span className="text-slate-500 text-xs flex-shrink-0">{client.cnpj}</span>
          )}
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {client.email && (
            <span className="flex items-center gap-1 text-slate-400 text-xs">
              <Mail size={11} />
              {client.email}
            </span>
          )}
          {client.phone && (
            <span className="flex items-center gap-1 text-slate-400 text-xs">
              <Phone size={11} />
              {client.phone}
            </span>
          )}
          {(client.city || client.state) && (
            <span className="flex items-center gap-1 text-slate-400 text-xs">
              <MapPin size={11} />
              {[client.city, client.state].filter(Boolean).join(' — ')}
            </span>
          )}
        </div>
      </div>

      {/* Status */}
      <span
        className={`text-xs px-2.5 py-1 rounded-lg flex-shrink-0 ${
          client.active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-500'
        }`}
      >
        {client.active ? 'Ativo' : 'Inativo'}
      </span>

      {/* Actions */}
      {canEdit && (
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <Link
            href={`/dashboard/clientes/${client.id}/editar`}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <Pencil size={14} />
          </Link>
          <button
            onClick={toggleActive}
            disabled={loading}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors disabled:opacity-50"
            title={client.active ? 'Desativar' : 'Ativar'}
          >
            {client.active ? (
              <ToggleRight size={14} className="text-emerald-400" />
            ) : (
              <ToggleLeft size={14} />
            )}
          </button>
        </div>
      )}
    </div>
  )
}
