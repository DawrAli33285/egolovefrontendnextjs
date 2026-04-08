import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (!pathname.startsWith('/admin')) return NextResponse.next();

  if (
    pathname === '/admin/login' ||
    pathname === '/admin/register' ||
    pathname.startsWith('/api/admin/auth')
  ) {
    return NextResponse.next();
  }

  // Just check cookie exists — full verification happens in the page/route
  const cookie = req.cookies.get('admin_session');
  if (!cookie?.value) {
    const loginUrl = new URL('/admin/login', req.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};