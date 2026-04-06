import { NextResponse }         from 'next/server'
import bcrypt                   from 'bcryptjs'
import prisma                   from '@/lib/prisma'
import { signToken }            from '@/lib/auth'

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ message: 'Email and password are required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 })
    }

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 })
    }

    
    await prisma.user.update({
      where: { id: user.id },
      data:  { lastLogin: new Date() },
    })

    const token = signToken(user.id)

    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json({
      message: 'Login successful',
      token,
      user: userWithoutPassword,
    })
  } catch (error: any) {
    return NextResponse.json({ message: 'Server error', error: error.message }, { status: 500 })
  }
}