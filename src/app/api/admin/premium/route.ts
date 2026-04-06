import { NextRequest, NextResponse } from 'next/server'
import prisma                              from '@/lib/prisma'
import { requireAuth, requireAdmin } from '@/lib/adminauth'

export async function GET(req: NextRequest) {
  const authResult = await requireAuth(req)
  if (authResult instanceof NextResponse) return authResult

  const adminCheck = requireAdmin(authResult.user)
  if (adminCheck) return adminCheck

  try {
    const [byAge, byCSP, byRegion, byCountry, registrationStats, loginStats] =
      await Promise.all([
        prisma.user.groupBy({
          by: ['age'],
          where: { barometerResults: { some: {} } },
          _count: { _all: true },
          orderBy: { age: 'asc' },
        }),

        prisma.user.groupBy({
          by: ['csp'],
          where: { barometerResults: { some: {} } },
          _count: { _all: true },
          orderBy: { _count: { csp: 'desc' } },
        }),

        prisma.user.groupBy({
          by: ['region'],
          where: { barometerResults: { some: {} } },
          _count: { _all: true },
          orderBy: { _count: { region: 'desc' } },
        }),

        prisma.user.groupBy({
          by: ['country'],
          where: { barometerResults: { some: {} } },
          _count: { _all: true },
          orderBy: { _count: { country: 'desc' } },
        }),

        // Registration stats grouped by date
        prisma.$queryRaw<{ date: string; count: bigint }[]>`
          SELECT TO_CHAR("createdAt", 'YYYY-MM-DD') AS date, COUNT(*) AS count
          FROM users
          GROUP BY date
          ORDER BY date ASC
        `,

        // Login stats grouped by date
        prisma.$queryRaw<{ date: string; count: bigint }[]>`
          SELECT TO_CHAR("lastLogin", 'YYYY-MM-DD') AS date, COUNT(*) AS count
          FROM users
          WHERE "lastLogin" IS NOT NULL
          GROUP BY date
          ORDER BY date ASC
        `,
      ])

    return NextResponse.json({
      message: 'Premium dashboard',
      data: {
        byAge:    byAge.map((d) => ({ _id: d.age,     count: d._count._all })),
        byCSP:    byCSP.map((d) => ({ _id: d.csp,     count: d._count._all })),
        byRegion: byRegion.map((d) => ({ _id: d.region, count: d._count._all })),
        byCountry: byCountry.map((d) => ({ _id: d.country, count: d._count._all })),
        // BigInt must be serialized
        registrationStats: registrationStats.map((r) => ({
          _id: r.date,
          count: Number(r.count),
        })),
        loginStats: loginStats.map((r) => ({
          _id: r.date,
          count: Number(r.count),
        })),
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { message: 'Server error', error: error.message },
      { status: 500 }
    )
  }
}