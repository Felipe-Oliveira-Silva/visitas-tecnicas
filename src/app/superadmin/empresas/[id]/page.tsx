import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import EmpresaActions from "./empresa-actions"

export default async function EmpresaDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()

  if (!session || session.user.role !== "SUPERADMIN") {
    redirect("/dashboard")
  }

  const { id } = await params

  const empresa = await prisma.company.findUnique({
    where: { id },
    include: {
      users: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          active: true,
          createdAt: true,
        },
        orderBy: { createdAt: "asc" },
      },
      _count: {
        select: { visits: true, clients: true },
      },
    },
  })

  if (!empresa) redirect("/superadmin")

  const planLabel: Record<string, string> = {
    start: "Start",
    pro: "Pro",
    enterprise: "Enterprise",
  }

  return (
    <div className="max-w-3xl flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">{empresa.name}</h1>
          <p className="text-slate-400 text-sm mt-1">
            Criada em {new Date(empresa.createdAt).toLocaleDateString("pt-BR")}
          </p>
        </div>
        
          <a href="/superadmin"
          className="text-slate-400 hover:text-slate-100 text-sm transition-colors"
        >
          Voltar
        </a>
      </div>

      <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 grid grid-cols-2 gap-4">
        <div>
          <p className="text-slate-400 text-xs mb-1">CNPJ</p>
          <p className="text-slate-100 text-sm">{empresa.cnpj || "—"}</p>
        </div>
        <div>
          <p className="text-slate-400 text-xs mb-1">Email</p>
          <p className="text-slate-100 text-sm">{empresa.email || "—"}</p>
        </div>
        <div>
          <p className="text-slate-400 text-xs mb-1">Telefone</p>
          <p className="text-slate-100 text-sm">{empresa.phone || "—"}</p>
        </div>
        <div>
          <p className="text-slate-400 text-xs mb-1">Plano atual</p>
          <p className="text-slate-100 text-sm font-medium">
            {planLabel[empresa.plan ?? ''] ?? empresa.plan}
          </p>
        </div>
        <div>
          <p className="text-slate-400 text-xs mb-1">Visitas</p>
          <p className="text-slate-100 text-sm">{empresa._count.visits}</p>
        </div>
        <div>
          <p className="text-slate-400 text-xs mb-1">Clientes</p>
          <p className="text-slate-100 text-sm">{empresa._count.clients}</p>
        </div>
      </div>

      <EmpresaActions
        empresaId={empresa.id}
        planAtual={empresa.plan}
        activeAtual={empresa.active}
      />

      <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-700">
          <h2 className="text-slate-100 font-medium">Usuários</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700 text-slate-400 text-left">
              <th className="px-4 py-3 font-medium">Nome</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {empresa.users.map((user) => (
              <tr key={user.id} className="border-b border-slate-800">
                <td className="px-4 py-3 text-slate-100">{user.name}</td>
                <td className="px-4 py-3 text-slate-400">{user.email}</td>
                <td className="px-4 py-3 text-slate-400">{user.role}</td>
                <td className="px-4 py-3">
                  {user.active ? (
                    <span className="text-green-400 text-xs">Ativo</span>
                  ) : (
                    <span className="text-red-400 text-xs">Inativo</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}