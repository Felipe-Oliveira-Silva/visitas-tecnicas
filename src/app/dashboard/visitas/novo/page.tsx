import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { VisitForm } from '../visit-form'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export default async function NovaVisitaPage() {
  const session = await auth()
  if (!session || session.user.role === 'READER') redirect('/dashboard/visitas')

  return (
    <div>
      <Link
        href="/dashboard/visitas"
        className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 mb-4 transition-colors"
      >
        <ChevronLeft size={15} /> Voltar para visitas
      </Link>
      <h1 className="text-2xl font-bold text-slate-100 mb-6">Agendar Visita</h1>
      <VisitForm mode="create" />
    </div>
  )
}
