
import { redirect, notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ClientForm } from '../../client-form'
import Link from 'next/link'
import { ChevronLeft, Pencil } from 'lucide-react'

export default async function EditarClientePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()

  if (!session || session.user.role === 'READER') redirect('/dashboard')

  const client = await prisma.client.findFirst({
    where: { id, companyId: session.user.companyId },
  })

  if (!client) notFound()

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
          <Pencil size={24} className="text-violet-400" />
          Editar Cliente
        </h2>
        <p className="text-slate-400 mt-1">
          Editando: <span className="text-slate-300">{client.name}</span>
        </p>
      </div>

      <ClientForm
        mode="edit"
        clientId={client.id}
        defaultValues={{
          name: client.name,
          cnpj: client.cnpj ?? '',
          email: client.email ?? '',
          phone: client.phone ?? '',
          address: client.address ?? '',
          city: client.city ?? '',
          state: client.state ?? '',
          notes: client.notes ?? '',
        }}
      />
    </div>
  )
}
