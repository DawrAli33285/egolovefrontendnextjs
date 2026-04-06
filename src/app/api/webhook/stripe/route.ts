import { NextResponse } from 'next/server'
import Stripe           from 'stripe'
import prisma           from '@/lib/prisma'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

// Required for Stripe webhooks — disable body parsing
export const config = {
  api: { bodyParser: false },
}

export async function POST(req: Request) {
  try {
    const body = await req.text()
    const sig  = req.headers.get('stripe-signature')

    if (!sig) {
      return NextResponse.json({ message: 'Missing stripe signature' }, { status: 400 })
    }

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(
        body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET!
      )
    } catch (err: any) {
      return NextResponse.json(
        { message: `Webhook error: ${err.message}` },
        { status: 400 }
      )
    }

    if (event.type === 'customer.subscription.deleted') {
      const stripeSubscription = event.data.object as Stripe.Subscription

      await prisma.subscription.updateMany({
        where: { stripe_Subscription_Id: stripeSubscription.id },
        data:  { status: 'unactive' },
      })

      // Also update user isPremium
      const subscription = await prisma.subscription.findFirst({
        where: { stripe_Subscription_Id: stripeSubscription.id },
      })

      if (subscription) {
        await prisma.user.update({
          where: { id: subscription.userId },
          data:  { isPremium: false },
        })
      }
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    return NextResponse.json(
      { message: 'Server error', error: error.message },
      { status: 500 }
    )
  }
}