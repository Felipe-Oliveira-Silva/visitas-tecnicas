
import { redirect, notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { UserForm } from '../../user-form'
import Link from 'next/link'
import { ChevronLeft, Pencil } from 'lucide-react'

export default async function EditarUsuarioPage({ params }: { params: { id: string } }) {
  const session = await auth()

  if (!session || session.user.role !== 'ADMIN' && session.user.role !== 'SUPERADMIN') redirect('/dashboard')

  const user = await prisma.user.findFirst({
    where: { id: params.id, companyId: session.user.companyId },
    select: { id: true, name: true, email: true, role: true },
  })

  if (!user) notFound()

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
          <Pencil size={24} className="text-cyan-400" />
          Editar Usuário
        </h2>
        <p className="text-slate-400 mt-1">Editando: <span className="text-slate-300">{user.name}</span></p>
      </div>

      <UserForm
        mode="edit"
        userId={user.id}
        defaultValues={{ name: user.name, email: user.email, role: user.role }}
      />
    </div>
  )
}
