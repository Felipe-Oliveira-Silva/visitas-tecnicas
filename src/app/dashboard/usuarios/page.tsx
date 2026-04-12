
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkUserLimit } from '@/lib/plan-limits'
import Link from 'next/link'
import { UserCard } from './user-card'
import { Plus, Users } from 'lucide-react'

export default async function UsuariosPage() {
  const session = await auth()

  if (!session) redirect('/login')
  if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPERADMIN') redirect('/dashboard')

  const [userCheck, users] = await Promise.all([
    checkUserLimit(session.user.companyId),
    prisma.user.findMany({
      where: { companyId: session.user.companyId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  const atLimit = !userCheck.allowed

  const roleCount = {
    ADMIN: users.filter((u) => u.role === 'ADMIN').length,
    TECHNICIAN: users.filter((u) => u.role === 'TECHNICIAN').length,
    READER: users.filter((u) => u.role === 'READER').length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users size={24} className="text-cyan-400" />
            Usuários
          </h2>
          <p className="text-slate-400 mt-1">{users.length} usuário{users.length !== 1 ? 's' : ''} cadastrado{users.length !== 1 ? 's' : ''}</p>
        </div>
        {atLimit ? (
          <button
            disabled
            title="Limite do plano atingido"
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-700 text-slate-500 font-semibold rounded-xl cursor-not-allowed text-sm"
          >
            <Plus size={16} />
            Novo Usuário
          </button>
        ) : (
          <Link
            href="/dashboard/usuarios/novo"
            className="flex items-center gap-2 px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-semibold rounded-xl transition-colors text-sm"
          >
            <Plus size={16} />
            Novo Usuário
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Admins', count: roleCount.ADMIN, color: 'text-cyan-400 bg-cyan-500/10' },
          { label: 'Técnicos', count: roleCount.TECHNICIAN, color: 'text-violet-400 bg-violet-500/10' },
          { label: 'Leitores', count: roleCount.READER, color: 'text-amber-400 bg-amber-500/10' },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl p-3 ${s.color} border border-white/5`}>
            <p className="text-2xl font-bold">{s.count}</p>
            <p className="text-xs opacity-70 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* List */}
      {users.length === 0 ? (
        <div className="bg-slate-900 border border-slate-700/50 rounded-2xl p-12 text-center">
          <Users size={40} className="text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">Nenhum usuário cadastrado ainda.</p>
          <Link href="/dashboard/usuarios/novo" className="text-cyan-400 hover:underline text-sm mt-2 inline-block">
            Criar primeiro usuário
          </Link>
        </div>
      ) : (
        <div className="grid gap-3">
          {users.map((user) => (
            <UserCard key={user.id} user={user} currentUserId={session.user.id} />
          ))}
        </div>
      )}
    </div>
  )
}
