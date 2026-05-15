import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { LandingNav } from '@/components/landing/landing-nav'
import { Hero } from '@/components/landing/hero'
import { PainSection } from '@/components/landing/pain-section'
import { SolutionFlow } from '@/components/landing/solution-flow'
import { FeaturesSection } from '@/components/landing/features-section'
import { AudienceSection } from '@/components/landing/audience-section'
import { PreviewSection } from '@/components/landing/preview-section'
import { BenefitsSection } from '@/components/landing/benefits-section'
import { PlansSection } from '@/components/landing/plans-section'
import { FaqSection } from '@/components/landing/faq-section'
import { FinalCta } from '@/components/landing/final-cta'
import { LandingFooter } from '@/components/landing/landing-footer'

export default async function HomePage() {
  const session = await auth()

  let companyActive = false
  let userName: string | null = null

  if (session) {
    const company = await prisma.company.findUnique({
      where: { id: session.user.companyId },
      select: { active: true },
    })
    companyActive = company?.active ?? false
    if (companyActive) redirect('/dashboard')
    userName = session.user.name ?? null
  }

  const authenticated = !!session
  const pendingActivation = authenticated && !companyActive

  return (
    <div className="min-h-screen bg-[#080d14] text-slate-100">
      <LandingNav authenticated={authenticated} />

      {pendingActivation && (
        <div className="bg-[#0d1b2a] border-b border-[#1e3a5f] px-6 py-3 text-center text-sm text-slate-300">
          {userName ? (
            <>
              👤 Olá,{' '}
              <strong className="text-slate-100">{userName}</strong> — sua
              conta está pendente de ativação. Escolha um plano abaixo para
              começar.
            </>
          ) : (
            <>
              👤 Sua conta está pendente de ativação. Escolha um plano abaixo
              para começar.
            </>
          )}
        </div>
      )}

      <Hero />
      <PainSection />
      <SolutionFlow />
      <FeaturesSection />
      <AudienceSection />
      <PreviewSection />
      <BenefitsSection />
      <PlansSection showActivationNote={pendingActivation} />
      <FaqSection />
      <FinalCta />
      <LandingFooter authenticated={authenticated} />
    </div>
  )
}
