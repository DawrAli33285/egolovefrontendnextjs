
import { NextResponse }                     from 'next/server'
import prisma                               from '@/lib/prisma'
import { verifyToken, getTokenFromRequest } from '@/lib/auth'

export async function GET(req: Request) {
  try {
    const token = getTokenFromRequest(req)
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id:        true,
        full_name: true,
        email:     true,
        age:       true,
        avatar:    true,
        isPremium: true,
        role:      true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 400 })
    }

    return NextResponse.json({ user })
  } catch (error: any) {
    console.log(error.message)
    return NextResponse.json({ message: 'Server error', error: error.message }, { status: 500 })
  }
}