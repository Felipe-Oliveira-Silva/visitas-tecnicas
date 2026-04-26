
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { ClientForm } from '../client-form'
import Link from 'next/link'
import { ChevronLeft, Building2 } from 'lucide-react'

export default async function NovoClientePage() {
  const session = await auth()

  if (!session || session.user.role === 'READER') redirect('/dashboard')

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard/clientes"
          className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm transition-colors mb-4"
        >
          <ChevronLeft size={16} />
          Voltar para Clientes
        </Link>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Building2 size={24} className="text-violet-400" />
          Novo Cliente
        </h2>
        <p className="text-slate-400 mt-1">Preencha os dados para cadastrar um novo cliente.</p>
      </div>

      <ClientForm mode="create" />
    </div>
  )
}
