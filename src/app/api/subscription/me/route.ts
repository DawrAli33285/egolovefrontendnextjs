import { NextResponse }                    from 'next/server'
import prisma                              from '@/lib/prisma'
import { verifyToken, getTokenFromRequest } from '@/lib/auth'

export async function GET(req: Request) {
  try {
    const token = getTokenFromRequest(req)
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)

    const subscription = await prisma.subscription.findFirst({
      where: { userId: decoded.id },
    })

    if (!subscription) {
      return NextResponse.json(
        { message: 'No subscription found for this user' },
        { status: 404 }
      )
    }

    return NextResponse.json(subscription)
  } catch (error: any) {
    return NextResponse.json(
      { message: 'Server error', error: error.message },
      { status: 500 }
    )
  }
}