
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { ClientCard } from './client-card'
import { Plus, Building2 } from 'lucide-react'

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: { search?: string }
}) {
  const session = await auth()
  if (!session) redirect('/login')

  const search = searchParams.search ?? ''

  const clients = await prisma.client.findMany({
    where: {
      companyId: session.user.companyId,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
              { cnpj: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: 'desc' },
  })

  const canEdit = session.user.role !== 'READER'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Building2 size={24} className="text-violet-400" />
            Clientes
          </h2>
          <p className="text-slate-400 mt-1">
            {clients.length} cliente{clients.length !== 1 ? 's' : ''} encontrado{clients.length !== 1 ? 's' : ''}
            {search && <span className="text-slate-500"> para "{search}"</span>}
          </p>
        </div>
        {canEdit && (
          <Link
            href="/dashboard/clientes/novo"
            className="flex items-center gap-2 px-4 py-2.5 bg-violet-500 hover:bg-violet-400 text-white font-semibold rounded-xl transition-colors text-sm"
          >
            <Plus size={16} />
            Novo Cliente
          </Link>
        )}
      </div>

      {/* Search */}
      <form method="GET" className="flex gap-2">
        <input
          type="text"
          name="search"
          defaultValue={search}
          placeholder="Buscar por nome, CNPJ ou e-mail..."
          className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 transition-colors"
        />
        <button
          type="submit"
          className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors text-sm font-medium"
        >
          Buscar
        </button>
        {search && (
          <Link
            href="/dashboard/clientes"
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-xl transition-colors text-sm"
          >
            Limpar
          </Link>
        )}
      </form>

      {/* List */}
      {clients.length === 0 ? (
        <div className="bg-slate-900 border border-slate-700/50 rounded-2xl p-12 text-center">
          <Building2 size={40} className="text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">
            {search ? 'Nenhum cliente encontrado para esta busca.' : 'Nenhum cliente cadastrado ainda.'}
          </p>
          {!search && canEdit && (
            <Link href="/dashboard/clientes/novo" className="text-violet-400 hover:underline text-sm mt-2 inline-block">
              Cadastrar primeiro cliente
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-3">
          {clients.map((client) => (
            <ClientCard key={client.id} client={client} canEdit={canEdit} />
          ))}
        </div>
      )}
    </div>
  )
}
