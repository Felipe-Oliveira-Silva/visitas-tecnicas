import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"

export default async function SuperAdminPage() {
  const session = await auth()

  if (!session || session.user.role !== "SUPERADMIN") {
    redirect("/dashboard")
  }

  const empresas = await prisma.company.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { users: true, visits: true },
      },
    },
  })

  const planLabel: Record<string, string> = {
    start: "Start",
    pro: "Pro",
    enterprise: "Enterprise",
  }

  const planColor: Record<string, string> = {
    start: "text-slate-400",
    pro: "text-cyan-400",
    enterprise: "text-yellow-400",
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-100">Empresas</h1>
        <Link
          href="/superadmin/empresas/nova"
          className="bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          + Nova Empresa
        </Link>
      </div>

      <div className="bg-slate-900 rounded-xl border border-slate-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700 text-slate-400 text-left">
              <th className="px-4 py-3 font-medium">Empresa</th>
              <th className="px-4 py-3 font-medium">CNPJ</th>
              <th className="px-4 py-3 font-medium">Plano</th>
              <th className="px-4 py-3 font-medium">Usuários</th>
              <th className="px-4 py-3 font-medium">Visitas</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Criada em</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {empresas.map((empresa) => (
              <tr
                key={empresa.id}
                className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors"
              >
                <td className="px-4 py-3 font-medium text-slate-100">
                  {empresa.name}
                </td>
                <td className="px-4 py-3 text-slate-400">
                  {empresa.cnpj || "—"}
                </td>
                <td className={`px-4 py-3 font-medium ${planColor[empresa.plan ?? ''] ?? "text-slate-400"}`}>
                  {planLabel[empresa.plan ?? ''] ?? empresa.plan}
                </td>
                <td className="px-4 py-3 text-slate-400">
                  {empresa._count.users}
                </td>
                <td className="px-4 py-3 text-slate-400">
                  {empresa._count.visits}
                </td>
                <td className="px-4 py-3">
                  {empresa.active ? (
                    <span className="text-green-400 font-medium">Ativa</span>
                  ) : (
                    <span className="text-red-400 font-medium">Inativa</span>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-400">
                  {new Date(empresa.createdAt).toLocaleDateString("pt-BR")}
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/superadmin/empresas/${empresa.id}`}
                    className="text-cyan-500 hover:text-cyan-400 text-sm"
                  >
                    Detalhes →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {empresas.length === 0 && (
          <p className="text-center text-slate-500 py-12">
            Nenhuma empresa cadastrada.
          </p>
        )}
      </div>
    </div>
  )
}