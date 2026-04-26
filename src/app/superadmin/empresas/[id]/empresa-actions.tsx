"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

interface Props {
  empresaId: string
  planAtual: string
  activeAtual: boolean
}

export default function EmpresaActions({ empresaId, planAtual, activeAtual }: Props) {
  const router = useRouter()
  const [plan, setPlan] = useState(planAtual)
  const [active, setActive] = useState(activeAtual)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState("")

  async function atualizar(dados: { plan?: string; active?: boolean }) {
    setLoading(true)
    setMsg("")

    const res = await fetch(`/api/superadmin/empresas/${empresaId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dados),
    })

    setLoading(false)

    if (res.ok) {
      setMsg("Atualizado com sucesso!")
      router.refresh()
    } else {
      setMsg("Erro ao atualizar.")
    }
  }

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 flex flex-col gap-4">
      <h2 className="text-slate-100 font-medium">Gerenciar</h2>

      <div className="flex items-end gap-4">
        <div className="flex-1">
          <label className="block text-sm text-slate-400 mb-1">Plano</label>
          <select
            value={plan}
            onChange={(e) => setPlan(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-cyan-500"
          >
            <option value="start">Start</option>
            <option value="pro">Pro</option>
            <option value="enterprise">Enterprise</option>
          </select>
        </div>
        <button
          onClick={() => atualizar({ plan })}
          disabled={loading}
          className="bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          Salvar plano
        </button>
      </div>

      <div className="flex items-center gap-4 pt-2 border-t border-slate-700">
        <div className="flex-1">
          <p className="text-sm text-slate-400">
            Status atual:{" "}
            <span className={active ? "text-green-400 font-medium" : "text-red-400 font-medium"}>
              {active ? "Ativa" : "Inativa"}
            </span>
          </p>
        </div>
        <button
          onClick={() => {
            const novoStatus = !active
            setActive(novoStatus)
            atualizar({ active: novoStatus })
          }}
          disabled={loading}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
            active
              ? "bg-red-500/20 hover:bg-red-500/30 text-red-400"
              : "bg-green-500/20 hover:bg-green-500/30 text-green-400"
          }`}
        >
          {active ? "Desativar empresa" : "Ativar empresa"}
        </button>
      </div>

      {msg && <p className="text-sm text-cyan-400">{msg}</p>}
    </div>
  )
}