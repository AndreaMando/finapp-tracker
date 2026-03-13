"use client";

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token');
  const isLoginPage = request.nextUrl.pathname === '/';

  // if token is not present and user is trying to access a protected route, redirect to login
  if (!token && !isLoginPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // if user has the token and is trying to access the login page, redirect to dashboard
  if (token && isLoginPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

// apply this middleware to all routes under /dashboard, /income, /recurring, /expenses, /goals and /login
export const config = {
  matcher: ['/dashboard/:path*', '/income/:path*', '/recurring/:path*', '/expenses/:path*', '/goals/:path*', '/'],
};
