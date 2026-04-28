'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Pencil, ToggleLeft, ToggleRight, Shield, Wrench, Eye } from 'lucide-react'

type User = {
  id: string
  name: string
  email: string
  role: string
  active: boolean
  createdAt: Date | string
}

const roleConfig: Record<string, { label: string; icon: typeof Shield; color: string }> = {
  ADMIN: { label: 'Admin', icon: Shield, color: 'text-cyan-400 bg-cyan-500/10' },
  TECHNICIAN: { label: 'Técnico', icon: Wrench, color: 'text-violet-400 bg-violet-500/10' },
  READER: { label: 'Leitor', icon: Eye, color: 'text-amber-400 bg-amber-500/10' },
}

export function UserCard({ user, currentUserId }: { user: User; currentUserId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const isSelf = user.id === currentUserId
  const role = roleConfig[user.role] ?? roleConfig.READER
  const Icon = role.icon

  const toggleActive = async () => {
    setLoading(true)
    await fetch(`/api/usuarios/${user.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !user.active }),
    })
    router.refresh()
    setLoading(false)
  }

  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div className={`bg-slate-900 border rounded-2xl px-5 py-4 flex items-center gap-4 transition-colors ${user.active ? 'border-slate-700/50 hover:border-slate-600' : 'border-slate-800 opacity-60'}`}>
      {/* Avatar */}
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
        {initials}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-white font-medium truncate">{user.name}</p>
          {isSelf && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-700 text-slate-400 flex-shrink-0">Você</span>
          )}
        </div>
        <p className="text-slate-400 text-sm truncate">{user.email}</p>
      </div>

      {/* Role badge */}
      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium flex-shrink-0 ${role.color}`}>
        <Icon size={12} />
        {role.label}
      </div>

      {/* Status */}
      <span className={`text-xs px-2.5 py-1 rounded-lg flex-shrink-0 ${user.active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
        {user.active ? 'Ativo' : 'Inativo'}
      </span>

      {/* Actions */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <Link
          href={`/dashboard/usuarios/${user.id}/editar`}
          className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
        >
          <Pencil size={14} />
        </Link>

        {!isSelf && (
          <button
            onClick={toggleActive}
            disabled={loading}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors disabled:opacity-50"
            title={user.active ? 'Desativar' : 'Ativar'}
          >
            {user.active ? <ToggleRight size={14} className="text-emerald-400" /> : <ToggleLeft size={14} />}
          </button>
        )}
      </div>
    </div>
  )
}
