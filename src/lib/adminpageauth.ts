
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

const ADMIN_SECRET = process.env.ADMIN_JWT_SECRET || 'change-this-secret-in-production';
const COOKIE_NAME  = 'admin_session';
const MAX_AGE      = 60 * 60 * 8; 

export interface AdminSession {
  id: number;
  email: string;
}

function base64url(str: string): string {
  return Buffer.from(str)
    .toString('base64url'); // ← use Node's native base64url directly
}

function hmacSign(data: string, secret: string): string {
  const crypto = require('crypto');
  return crypto.createHmac('sha256', secret).update(data).digest('base64url');
}

export function signToken(payload: AdminSession): string {
  const header  = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body    = base64url(JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + MAX_AGE }));
  const sig     = hmacSign(`${header}.${body}`, ADMIN_SECRET);
  return `${header}.${body}.${sig}`;
}

export function verifyToken(token: string): AdminSession | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, body, sig] = parts;
    const expectedSig = hmacSign(`${header}.${body}`, ADMIN_SECRET);
    if (sig !== expectedSig) return null;
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return { id: payload.id, email: payload.email };
  } catch(e) {
    console.log('[verifyToken] error:', e); // ← add this
    return null;
  }
}

export function setSessionCookie(token: string): { name: string; value: string; options: any } {
  return {
    name:  COOKIE_NAME,
    value: token,
    options: {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge:   MAX_AGE,
      path:     '/',
    },
  };
}

export function getSessionFromRequest(req: NextRequest): AdminSession | null {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}


export async function getAdminSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export { COOKIE_NAME };
