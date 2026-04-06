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
      by: ['csp'],
      where: { barometerResults: { some: {} } },
      _count: { _all: true },
      orderBy: { _count: { csp: 'desc' } },
    })

    const formatted = data.map((d) => ({ _id: d.csp, count: d._count._all }))

    return NextResponse.json({ message: 'Reports by CSP', data: formatted })
  } catch (error: any) {
    return NextResponse.json(
      { message: 'Server error', error: error.message },
      { status: 500 }
    )
  }
}