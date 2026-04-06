import { NextResponse }                    from 'next/server'
import prisma                              from '@/lib/prisma'
import { verifyToken, getTokenFromRequest } from '@/lib/auth'

export async function POST(req: Request) {
  try {
    const {
      quizType,
      language,
      answers,
      pillarResults,
      globalEgoPercent,
      globalLovePercent,
      globalProfile,
    } = await req.json()

    // User is optional for quiz
    const token   = getTokenFromRequest(req)
    let   userId: number | null = null

    if (token) {
      try {
        const decoded = verifyToken(token)
        userId = decoded.id
      } catch {
        userId = null
      }
    }

    const result = await prisma.barometerResult.create({
      data: {
        userId,
        quizType,
        language,
        answers,
        pillarResults,
        globalEgoPercent,
        globalLovePercent,
        globalProfile,
      },
    })

    return NextResponse.json(
      { message: 'Result saved successfully', result },
      { status: 201 }
    )
  } catch (error: any) {
    return NextResponse.json(
      { message: 'Server error', error: error.message },
      { status: 500 }
    )
  }
}