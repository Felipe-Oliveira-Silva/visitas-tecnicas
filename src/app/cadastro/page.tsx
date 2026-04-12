'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function CadastroPage() {
  const router = useRouter()

  const [nomeEmpresa, setNomeEmpresa] = useState('')
  const [nomeAdmin, setNomeAdmin] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [cnpj, setCnpj] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password !== confirm) {
      setError('As senhas não coincidem.')
      return
    }

    setLoading(true)

    const res = await fetch('/api/cadastro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nomeEmpresa, nomeAdmin, email, password, phone, cnpj }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Erro ao criar conta.')
      setLoading(false)
      return
    }

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })

    if (result?.error) {
      setError('Conta criada, mas não foi possível entrar automaticamente. Faça login.')
      setLoading(false)
      return
    }

    router.push('/')
  }

  return (
    <div className="min-h-screen bg-[#080d14] flex items-center justify-center px-4 py-12">
      <div className="bg-[#0d1b2a] border border-[#1e3a5f] rounded-2xl p-8 w-full max-w-md">
        <p className="text-cyan-500 text-xs font-extrabold tracking-widest text-center mb-1">
          RELATEC
        </p>
        <h1 className="text-slate-100 text-xl font-bold text-center mb-1">
          Criar conta
        </h1>
        <p className="text-slate-500 text-xs text-center mb-7">
          Preencha os dados para começar
        </p>

        {error && (
          <div className="bg-red-950 border border-red-800 text-red-400 text-sm px-4 py-3 rounded-lg mb-5">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-slate-400 text-xs uppercase tracking-wider mb-1.5">
              Nome da empresa *
            </label>
            <input
              type="text"
              value={nomeEmpresa}
              onChange={(e) => setNomeEmpresa(e.target.value)}
              placeholder="Ex: Manutenções Silva Ltda"
              required
              className="w-full bg-[#1e293b] border border-[#334155] rounded-lg px-3 py-2.5 text-slate-200 text-sm placeholder-slate-600 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-slate-400 text-xs uppercase tracking-wider mb-1.5">
              Seu nome *
            </label>
            <input
              type="text"
              value={nomeAdmin}
              onChange={(e) => setNomeAdmin(e.target.value)}
              placeholder="Ex: João Silva"
              required
              className="w-full bg-[#1e293b] border border-[#334155] rounded-lg px-3 py-2.5 text-slate-200 text-sm placeholder-slate-600 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-slate-400 text-xs uppercase tracking-wider mb-1.5">
              E-mail *
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="joao@empresa.com.br"
              required
              className="w-full bg-[#1e293b] border border-[#334155] rounded-lg px-3 py-2.5 text-slate-200 text-sm placeholder-slate-600 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 text-xs uppercase tracking-wider mb-1.5">
                Telefone
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(11) 99999-9999"
                className="w-full bg-[#1e293b] border border-[#334155] rounded-lg px-3 py-2.5 text-slate-200 text-sm placeholder-slate-600 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 text-xs uppercase tracking-wider mb-1.5">
                CNPJ
              </label>
              <input
                type="text"
                value={cnpj}
                onChange={(e) => setCnpj(e.target.value)}
                placeholder="00.000.000/0001-00"
                className="w-full bg-[#1e293b] border border-[#334155] rounded-lg px-3 py-2.5 text-slate-200 text-sm placeholder-slate-600 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 text-xs uppercase tracking-wider mb-1.5">
              Senha *
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full bg-[#1e293b] border border-[#334155] rounded-lg px-3 py-2.5 text-slate-200 text-sm placeholder-slate-600 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-slate-400 text-xs uppercase tracking-wider mb-1.5">
              Confirmar senha *
            </label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full bg-[#1e293b] border border-[#334155] rounded-lg px-3 py-2.5 text-slate-200 text-sm placeholder-slate-600 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-cyan-500 hover:bg-cyan-400 disabled:bg-cyan-800 text-white font-bold py-3 rounded-lg text-sm transition-colors mt-2"
          >
            {loading ? 'Criando conta...' : 'Criar conta →'}
          </button>
        </form>

        <p className="text-center text-slate-600 text-xs mt-5">
          Já tem conta?{' '}
          <Link href="/login" className="text-cyan-500 hover:text-cyan-400">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  )
}
