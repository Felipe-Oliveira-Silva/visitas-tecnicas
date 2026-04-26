"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function NovaEmpresaPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState("")

  const [form, setForm] = useState({
    nomeEmpresa: "",
    cnpj: "",
    phone: "",
    email: "",
    plan: "start",
    nomeAdmin: "",
    emailAdmin: "",
    senhaAdmin: "",
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit() {
    setErro("")

    if (!form.nomeEmpresa || !form.nomeAdmin || !form.emailAdmin || !form.senhaAdmin) {
      setErro("Preencha todos os campos obrigatórios.")
      return
    }

    setLoading(true)

    const res = await fetch("/api/superadmin/empresas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setErro(data.error || "Erro ao criar empresa.")
      return
    }

    router.push("/superadmin")
  }

  const inputClass = "w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-500"
  const labelClass = "block text-sm text-slate-400 mb-1"

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-100 mb-6">Nova Empresa</h1>

      <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 flex flex-col gap-6">

        <div>
          <h2 className="text-slate-300 font-medium mb-4">Dados da Empresa</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className={labelClass}>Nome *</label>
              <input name="nomeEmpresa" value={form.nomeEmpresa} onChange={handleChange} className={inputClass} placeholder="Nome da empresa" />
            </div>
            <div>
              <label className={labelClass}>CNPJ</label>
              <input name="cnpj" value={form.cnpj} onChange={handleChange} className={inputClass} placeholder="00.000.000/0000-00" />
            </div>
            <div>
              <label className={labelClass}>Telefone</label>
              <input name="phone" value={form.phone} onChange={handleChange} className={inputClass} placeholder="(00) 00000-0000" />
            </div>
            <div>
              <label className={labelClass}>Email da empresa</label>
              <input name="email" value={form.email} onChange={handleChange} className={inputClass} placeholder="contato@empresa.com" />
            </div>
            <div>
              <label className={labelClass}>Plano</label>
              <select name="plan" value={form.plan} onChange={handleChange} className={inputClass}>
                <option value="start">Start</option>
                <option value="pro">Pro</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-700 pt-6">
          <h2 className="text-slate-300 font-medium mb-4">Dados do Admin</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className={labelClass}>Nome do admin *</label>
              <input name="nomeAdmin" value={form.nomeAdmin} onChange={handleChange} className={inputClass} placeholder="Nome completo" />
            </div>
            <div>
              <label className={labelClass}>Email do admin *</label>
              <input name="emailAdmin" value={form.emailAdmin} onChange={handleChange} className={inputClass} placeholder="admin@empresa.com" type="email" />
            </div>
            <div>
              <label className={labelClass}>Senha inicial *</label>
              <input name="senhaAdmin" value={form.senhaAdmin} onChange={handleChange} className={inputClass} placeholder="Senha provisória" type="password" />
            </div>
          </div>
        </div>

        {erro && (
          <p className="text-red-400 text-sm">{erro}</p>
        )}

        <div className="flex gap-3 justify-end">
          <button
            onClick={() => router.push("/superadmin")}
            className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-slate-100 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            {loading ? "Criando..." : "Criar Empresa"}
          </button>
        </div>

      </div>
    </div>
  )
}