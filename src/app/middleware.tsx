import { auth } from "@/lib/auth";

export default auth;

// apply this middleware to all routes under /dashboard, /income, /recurring, /expenses, /goals and /login
export const config = {
  matcher: ['/dashboard/:path*', '/income/:path*', '/recurring/:path*', '/expenses/:path*', '/goals/:path*', '/'],
};
