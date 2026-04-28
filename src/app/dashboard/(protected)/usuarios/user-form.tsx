'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Save, Loader2, Eye, EyeOff } from 'lucide-react'
import { UpgradeModal } from '@/components/upgrade-modal'

type UserFormProps = {
  mode: 'create' | 'edit'
  userId?: string
  defaultValues?: {
    name?: string
    email?: string
    role?: string
  }
}

export function UserForm({ mode, userId, defaultValues }: UserFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [upgradeModal, setUpgradeModal] = useState<{
    open: boolean; limit: number; current: number
  }>({ open: false, limit: 0, current: 0 })

  const [form, setForm] = useState({
    name: defaultValues?.name ?? '',
    email: defaultValues?.email ?? '',
    password: '',
    role: defaultValues?.role ?? 'TECHNICIAN',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const body: Record<string, string> = {
      name: form.name,
      email: form.email,
      role: form.role,
    }

    if (form.password) body.password = form.password

    const url = mode === 'create' ? '/api/usuarios' : `/api/usuarios/${userId}`
    const method = mode === 'create' ? 'POST' : 'PUT'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (res.ok) {
      router.push('/dashboard/usuarios')
      router.refresh()
    } else {
      const data = await res.json()
      if (data.error === 'LIMIT_REACHED') {
        setUpgradeModal({ open: true, limit: data.limit, current: data.current })
      } else {
        setError(data.error ?? 'Erro ao salvar usuário')
      }
    }

    setLoading(false)
  }

  return (
    <>
    <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-700/50 rounded-2xl p-6 space-y-5 max-w-lg">
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-slate-300">Nome completo</label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
          placeholder="João Silva"
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 transition-colors"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-slate-300">E-mail</label>
        <input
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
          placeholder="joao@empresa.com"
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 transition-colors"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-slate-300">
          Senha {mode === 'edit' && <span className="text-slate-500 font-normal">(deixe em branco para não alterar)</span>}
        </label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required={mode === 'create'}
            placeholder="Mínimo 6 caracteres"
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 pr-10 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 transition-colors"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-slate-300">Perfil</label>
        <select
          value={form.role}
          onChange={(e) => setForm({ ...form, role: e.target.value })}
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 transition-colors"
        >
          <option value="ADMIN">Administrador</option>
          <option value="TECHNICIAN">Técnico</option>
          <option value="READER">Leitor</option>
        </select>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-60 text-slate-900 font-semibold rounded-xl transition-colors text-sm"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {mode === 'create' ? 'Criar Usuário' : 'Salvar Alterações'}
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
    <UpgradeModal
      open={upgradeModal.open}
      onClose={() => setUpgradeModal((m) => ({ ...m, open: false }))}
      resource="users"
      limit={upgradeModal.limit}
      current={upgradeModal.current}
    />
    </>
  )
}
