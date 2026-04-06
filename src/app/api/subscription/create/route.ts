import { NextResponse }                    from 'next/server'
import Stripe                              from 'stripe'
import prisma                              from '@/lib/prisma'
import { verifyToken, getTokenFromRequest } from '@/lib/auth'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: Request) {
  try {
    const token = getTokenFromRequest(req)
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)

    const {
      email,
      amount,
      currency = 'usd',
      interval = 'month',
      paymentMethod,
    } = await req.json()

    if (!paymentMethod) {
      return NextResponse.json(
        { message: 'Payment method is required' },
        { status: 400 }
      )
    }

    // Check existing active subscription
    const existingSubscription = await prisma.subscription.findFirst({
      where: {
        userId: decoded.id,
        status: 'active',
      },
    })

    if (existingSubscription) {
      return NextResponse.json(
        { message: 'User already has an active subscription' },
        { status: 400 }
      )
    }

    // Create Stripe customer
    const customer = await stripe.customers.create({ email })

    // Attach payment method
    await stripe.paymentMethods.attach(paymentMethod, {
      customer: customer.id,
    })

    // Set default payment method
    await stripe.customers.update(customer.id, {
      invoice_settings: { default_payment_method: paymentMethod },
    })

    // Create price
    const price = await stripe.prices.create({
      unit_amount:  Math.round(amount * 100),
      currency,
      recurring:    { interval: interval as Stripe.PriceCreateParams.Recurring.Interval },
      product_data: { name: 'Barometre EGO vs LOVE Premium' },
    })

    // Create Stripe subscription
    const stripeSubscription = await stripe.subscriptions.create({
      customer:               customer.id,
      items:                  [{ price: price.id }],
      default_payment_method: paymentMethod,
    })

    // Save to DB
    const subscription = await prisma.subscription.create({
      data: {
        userId:                decoded.id,
        price:                 amount,
        status:                'active',
        stripe_Subscription_Id: stripeSubscription.id,
      },
    })

    // Update user isPremium
    await prisma.user.update({
      where: { id: decoded.id },
      data:  { isPremium: true },
    })

    return NextResponse.json(
      { message: 'Subscription created successfully', subscription },
      { status: 201 }
    )
  } catch (error: any) {
    console.error(error.message)
    return NextResponse.json(
      { message: 'Server error', error: error.message },
      { status: 500 }
    )
  }
}