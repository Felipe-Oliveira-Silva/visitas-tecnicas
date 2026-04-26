import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import { VisitForm } from '../../visit-form'

export default async function EditarVisitaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session || session.user.role === 'READER') redirect('/dashboard/visitas')

  const visit = await prisma.visit.findFirst({
    where: { id, companyId: session.user.companyId },
  })

  if (!visit) notFound()

  const initialData = {
    id:           visit.id,
    clientId:     visit.clientId,
    technicianId: visit.technicianId,
    scheduledAt:  new Date(visit.scheduledAt).toISOString().slice(0, 16),
    observations: visit.observations || '',
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-100 mb-6">Editar Visita</h1>
      <VisitForm mode="edit" initialData={initialData} />
    </div>
  )
}