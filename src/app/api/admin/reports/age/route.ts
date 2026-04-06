import { NextRequest, NextResponse } from 'next/server'
import prisma                              from '@/lib/prisma'
import { requireAuth, requireAdmin } from '@/lib/adminauth'

export async function GET(req: NextRequest) {
  const authResult = await requireAuth(req)
  if (authResult instanceof NextResponse) return authResult

  const adminCheck = requireAdmin(authResult.user)
  if (adminCheck) return adminCheck

  try {
    const data = await prisma.user.groupBy({
      by: ['age'],
      where: { barometerResults: { some: {} } },
      _count: { _all: true },
      orderBy: { age: 'asc' },
    })

    const formatted = data.map((d) => ({ _id: d.age, count: d._count._all }))

    return NextResponse.json({ message: 'Reports by age', data: formatted })
  } catch (error: any) {
    return NextResponse.json(
      { message: 'Server error', error: error.message },
      { status: 500 }
    )
  }
}