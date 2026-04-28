import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { BILLING_PLANS, PlanKey } from '@/lib/billing'

const MP_API = 'https://api.mercadopago.com'

async function mpPost(path: string, body: unknown): Promise<{ id: string; init_point: string }> {
  const res = await fetch(`${MP_API}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`MP API ${res.status}: ${await res.text()}`)
  return res.json()
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  }

  const body = await req.json() as { planKey?: PlanKey }
  const planKey = body.planKey
  if (!planKey || !BILLING_PLANS[planKey]) {
    return NextResponse.json({ error: 'Plano inválido' }, { status: 400 })
  }

  const plan = BILLING_PLANS[planKey]
  const companyId = session.user.companyId

  const admin = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true },
  })
  if (!admin) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })

  const mpData = await mpPost('/preapproval', {
    reason: plan.description,
    external_reference: `${companyId}:${planKey}`,
    payer_email: admin.email,
    auto_recurring: {
      frequency: plan.frequency,
      frequency_type: plan.frequencyType,
      transaction_amount: plan.price,
      currency_id: plan.currencyId,
    },
    back_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/plano`,
    status: 'pending',
  })

  await prisma.subscription.create({
    data: {
      companyId,
      mpSubscriptionId: mpData.id,
      planKey,
      status: 'PENDING',
      checkoutUrl: mpData.init_point,
    },
  })

  return NextResponse.json({ checkoutUrl: mpData.init_point })
}
