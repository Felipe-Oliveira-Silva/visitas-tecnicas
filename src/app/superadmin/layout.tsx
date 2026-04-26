import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session || session.user.role !== "SUPERADMIN") {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="bg-slate-900 border-b border-slate-700 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-cyan-500 font-bold text-xl">Relatec</span>
          <span className="text-slate-400 text-sm">/ Super Admin</span>
             <a href="/dashboard"
              className="text-slate-100 hover:text-slate-100 text-sm transition-colors"
            >Ir para Dashboard</a>
    
        </div>
        <span className="text-slate-400 text-sm">{session.user.email}</span>
      </header>

      <div className="flex">
        <aside className="w-56 min-h-[calc(100vh-61px)] bg-slate-900 border-r border-slate-700 p-4">
          <nav className="flex flex-col gap-1">
            
             <a href="/superadmin"
              className="px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-slate-100 text-sm transition-colors"
            >
              Empresas
            </a>
            
              <a href="/superadmin/empresas/nova"
              className="px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-slate-100 text-sm transition-colors"
            >
              Nova Empresa
            </a>
          </nav>
        </aside>

        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}