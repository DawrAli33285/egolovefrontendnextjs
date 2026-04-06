import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import prisma                              from '@/lib/prisma'

export interface AuthUser {
  id: number
  email: string
  role: 'user' | 'admin'
}

export async function requireAuth(
  req: NextRequest
): Promise<{ user: AuthUser } | NextResponse> {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')

  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as AuthUser
    const user = await prisma.user.findUnique({ where: { id: decoded.id } })

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 401 })
    }

    return { user: { id: user.id, email: user.email, role: user.role } }
  } catch {
    return NextResponse.json({ message: 'Invalid token' }, { status: 401 })
  }
}

export function requireAdmin(user: AuthUser): NextResponse | null {
  if (user.role !== 'admin') {
    return NextResponse.json(
      { message: 'Access denied. Admins only.' },
      { status: 403 }
    )
  }
  return null
}