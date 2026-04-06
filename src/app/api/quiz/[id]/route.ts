import { NextResponse }                    from 'next/server'
import prisma                              from '@/lib/prisma'
import { verifyToken, getTokenFromRequest } from '@/lib/auth'

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const token = getTokenFromRequest(req)
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    verifyToken(token)

    const result = await prisma.barometerResult.findUnique({
      where: { id: parseInt(params.id) },
    })

    if (!result) {
      return NextResponse.json({ message: 'Result not found' }, { status: 404 })
    }

    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json(
      { message: 'Server error', error: error.message },
      { status: 500 }
    )
  }
}