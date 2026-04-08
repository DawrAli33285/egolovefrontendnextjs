import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ message: 'Email and password required' }, { status: 400 });
    }

    const validSecretKey = process.env.ADMIN_REGISTRATION_SECRET || 'your-secret-key-here';


    const existingAdmin = await prisma.admin.findUnique({ 
      where: { email: email.toLowerCase().trim() } 
    });

    if (existingAdmin) {
      return NextResponse.json({ message: 'Admin already exists' }, { status: 409 });
    }


    const hashedPassword = await bcrypt.hash(password, 10);


    const admin = await prisma.admin.create({
      data: {
        email: email.toLowerCase().trim(),
        password: hashedPassword,
      },
    });

    return NextResponse.json({ 
      ok: true, 
      message: 'Admin registered successfully',
      email: admin.email 
    });

  } catch (err: any) {
    console.error('Admin registration error:', err);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}