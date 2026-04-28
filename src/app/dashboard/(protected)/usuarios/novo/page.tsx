
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { UserForm } from '../user-form'
import Link from 'next/link'
import { ChevronLeft, UserPlus } from 'lucide-react'

export default async function NovoUsuarioPage() {
  const session = await auth()

  if (!session || session.user.role !== 'ADMIN' && session.user.role !== 'SUPERADMIN') redirect('/dashboard')

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard/usuarios"
          className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm transition-colors mb-4"
        >
          <ChevronLeft size={16} />
          Voltar para Usuários
        </Link>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <UserPlus size={24} className="text-cyan-400" />
          Novo Usuário
        </h2>
        <p className="text-slate-400 mt-1">Preencha os dados para criar um novo usuário.</p>
      </div>

      <UserForm mode="create" />
    </div>
  )
}
