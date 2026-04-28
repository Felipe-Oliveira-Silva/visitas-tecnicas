import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session) redirect('/login')

  const company = await prisma.company.findUnique({
    where: { id: session.user.companyId },
    select: { plan: true },
  })

  if (!company?.plan) redirect('/dashboard/plano')

  return <>{children}</>
}
