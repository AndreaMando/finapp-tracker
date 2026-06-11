import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth; // True if user is authenticated, false otherwise
  const { nextUrl } = req;

  // Protected routes: dashboard, income, recurring, expenses, goals
  // Note: do NOT treat the root (`/`) as a protected route here —
  // we want middleware to run on `/` to redirect logged-in users to `/dashboard`,
  // but we shouldn't redirect unauthenticated users from `/` back to `/` (loop).
  const isProtectedRoute = 
    nextUrl.pathname.startsWith("/dashboard") ||
    nextUrl.pathname.startsWith("/income") ||
    nextUrl.pathname.startsWith("/recurring") ||
    nextUrl.pathname.startsWith("/expenses") ||
    nextUrl.pathname.startsWith("/goals");

  const isLoginPage = nextUrl.pathname === "/";

  // 1. If the user is not logged in and tries to access a protected route -> Redirect to login page
  if (isProtectedRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL("/", nextUrl));
  }

  // 2. If the user is logged in and tries to access the login page -> Redirect to dashboard
  if (isLoginPage && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  // 3. For all other cases, allow the request to proceed
  return NextResponse.next();
});

export const config = {
  matcher: [
    '/',
    '/dashboard(/:path*)', 
    '/income(/:path*)', 
    '/recurring(/:path*)', 
    '/expenses(/:path*)', 
    '/goals(/:path*)',
  ],
};
