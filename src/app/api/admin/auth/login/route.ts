import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { signToken, setSessionCookie } from '@/lib/adminpageauth';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ message: 'Email and password required' }, { status: 400 });
    }

    const admin = await prisma.admin.findUnique({ where: { email: email.toLowerCase().trim() } });

    if (!admin) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, admin.password);
    if (!valid) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }

    const token = signToken({ id: admin.id, email: admin.email });
    
    const res = NextResponse.json({ ok: true, email: admin.email, redirectTo: req.headers.get('referer')?.split('?')[1]?.split('=')[1] || '/admin/quiz' });
    
    res.cookies.set({
      name: 'admin_session',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24,
      path: '/',
    });
    
    return res;

  } catch (err: any) {
    console.error('Admin login error:', err);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}