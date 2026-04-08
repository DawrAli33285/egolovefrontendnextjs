import { NextResponse }                    from 'next/server'
import bcrypt                              from 'bcryptjs'
import { writeFile, mkdir }                from 'fs/promises'
import path                                from 'path'
import prisma                              from '@/lib/prisma'
import { verifyToken, getTokenFromRequest } from '@/lib/auth'

export async function PUT(req: Request) {
  try {
    console.log("HEY")
    const token = getTokenFromRequest(req)
    const auth = req.headers.get('authorization')
    console.log("AUTH HEADER:", auth)
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)

    const formData   = await req.formData()
    const full_name  = formData.get('full_name') as string | null
    const email      = formData.get('email')     as string | null
    const password   = formData.get('password')  as string | null
    const age        = formData.get('age')        as string | null
    const file       = formData.get('avatar')     as File   | null

    const updateData: Record<string, any> = {}

    if (full_name) updateData.full_name = full_name
    if (email)     updateData.email     = email
    if (age)       updateData.age       = parseInt(age)

    if (password) {
      updateData.password = await bcrypt.hash(password, 10)
    }

    if (file) {
      const bytes  = await file.arrayBuffer()
      const base64 = Buffer.from(bytes).toString('base64')
      const mime   = file.type || 'image/jpeg'
      updateData.avatar = `data:${mime};base64,${base64}`
    }
    

    const updatedUser = await prisma.user.update({
      where: { id: decoded.id },
      data:  updateData,
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

    return NextResponse.json({ message: 'User updated successfully', user: updatedUser })
  } catch (error: any) {
    console.log(error.message)
    return NextResponse.json({ message: 'Server error', error: error.message }, { status: 500 })
  }
}