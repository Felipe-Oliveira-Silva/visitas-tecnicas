import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createHmac, timingSafeEqual } from 'crypto'

const MP_API = 'https://api.mercadopago.com'

type MPStatus = 'authorized' | 'pending' | 'paused' | 'cancelled'
type OurStatus = 'ACTIVE' | 'PENDING' | 'PAUSED' | 'CANCELLED'

const STATUS_MAP: Record<MPStatus, OurStatus> = {
  authorized: 'ACTIVE',
  pending:    'PENDING',
  paused:     'PAUSED',
  cancelled:  'CANCELLED',
}

function validateSignature(
  xSig: string | null,
  xReqId: string | null,
  dataId: string,
  secret: string
): boolean {
  if (!xSig || !xReqId) return false
  const parts = Object.fromEntries(xSig.split(',').map((p) => p.split('=')))
  const { ts, v1 } = parts as { ts?: string; v1?: string }
  if (!ts || !v1) return false
  const manifest = `id:${dataId};request-id:${xReqId};ts:${ts};`
  const hBuf = Buffer.from(createHmac('sha256', secret).update(manifest).digest('hex'))
  const vBuf = Buffer.from(v1)
  if (hBuf.length !== vBuf.length) return false
  return timingSafeEqual(hBuf, vBuf)
}

type MPPreapproval = {
  id: string
  status: MPStatus
  next_payment_date?: string
  external_reference?: string
}

type WebhookPayload = {
  type: string
  data: { id: string }
}

export async function POST(req: NextRequest) {
  const body = await req.json() as WebhookPayload

  const mpId = body.data?.id
  if (!mpId || typeof mpId !== 'string') {
    return NextResponse.json({ error: 'Bad payload' }, { status: 400 })
  }
  const secret = process.env.MP_WEBHOOK_SECRET

  if (secret) {
    const valid = validateSignature(
      req.headers.get('x-signature'),
      req.headers.get('x-request-id'),
      mpId,
      secret
    )
    if (!valid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }
  }

  if (body.type !== 'subscription_preapproval') {
    return NextResponse.json({ received: true })
  }

  // Fetch canonical state — never trust webhook payload alone
  const mpRes = await fetch(`${MP_API}/preapproval/${mpId}`, {
    headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` },
  })
  if (!mpRes.ok) {
    return NextResponse.json({ error: 'MP fetch failed' }, { status: 500 })
  }
  const mp = await mpRes.json() as MPPreapproval

  const subscription = await prisma.subscription.findUnique({
    where: { mpSubscriptionId: mpId },
  })
  if (!subscription) return NextResponse.json({ received: true })

  const newStatus: OurStatus = STATUS_MAP[mp.status] ?? subscription.status

  // Idempotency
  if (subscription.status === newStatus) return NextResponse.json({ received: true })

  if (newStatus === 'ACTIVE') {
    // Cancel any other ACTIVE subscriptions for this company
    const otherActives = await prisma.subscription.findMany({
      where: {
        companyId: subscription.companyId,
        status: 'ACTIVE',
        id: { not: subscription.id },
      },
    })

    for (const old of otherActives) {
      if (old.mpSubscriptionId) {
        await fetch(`${MP_API}/preapproval/${old.mpSubscriptionId}`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: 'cancelled' }),
        })
      }
      await prisma.subscription.update({
        where: { id: old.id },
        data: { status: 'CANCELLED' },
      })
    }

    await prisma.$transaction([
      prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          status: 'ACTIVE',
          currentPeriodEnd: mp.next_payment_date ? new Date(mp.next_payment_date) : null,
        },
      }),
      prisma.company.update({
        where: { id: subscription.companyId },
        data: { plan: subscription.planKey },
      }),
    ])
  } else if (newStatus === 'PAUSED' || newStatus === 'CANCELLED') {
    // Only revoke plan access if this subscription was the active one AND no other ACTIVE exists
    const hasOtherActive = await prisma.subscription.findFirst({
      where: {
        companyId: subscription.companyId,
        status: 'ACTIVE',
        id: { not: subscription.id },
      },
    })

    if (!hasOtherActive && subscription.status === 'ACTIVE') {
      await prisma.$transaction([
        prisma.subscription.update({
          where: { id: subscription.id },
          data: { status: newStatus },
        }),
        prisma.company.update({
          where: { id: subscription.companyId },
          data: { plan: null },
        }),
      ])
    } else {
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: { status: newStatus },
      })
    }
  } else {
    // PENDING — just update status, no change to Company.plan
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: newStatus },
    })
  }

  return NextResponse.json({ received: true })
}
