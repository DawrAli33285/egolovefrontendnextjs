import { NextResponse }  from 'next/server'
import bcrypt            from 'bcryptjs'
import prisma            from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const { full_name, email, password, age } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ message: 'Email and password are required' }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ message: 'Email already registered' }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        full_name,
        email,
        password: hashedPassword,
        age: age ? parseInt(age) : null,
        role: 'user',
      },
    })

 

    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json(
      { message: 'User registered successfully', user: userWithoutPassword },
      { status: 201 }
    )
  } catch (error: any) {
    console.error("erorr is"+error.message)
    return NextResponse.json({ message: 'Server error', error: error.message }, { status: 500 })
  }
}