import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const token =
    req.cookies.get("authjs.session-token") ||
    req.cookies.get("__Secure-authjs.session-token") ||
    req.cookies.get("next-auth.session-token");

  const isLoggedIn = !!token;

  const isAuthRoute = pathname.startsWith("/login") || pathname.startsWith("/register") || pathname.startsWith("/verify-email");
  const isProtectedDashboardRoute =
    pathname.startsWith("/insights") ||
    pathname.startsWith("/collections") ||
    pathname.startsWith("/pos") ||
    pathname.startsWith("/clientele") ||
    pathname.startsWith("/analytics") ||
    pathname.startsWith("/staff") ||
    pathname.startsWith("/settings");

  // 1. Unauthenticated users visiting root or protected routes redirect to /login
  if ((isProtectedDashboardRoute || pathname === "/") && !isLoggedIn) {
    const loginUrl = new URL("/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Logged-in users visiting auth routes redirect to /insights
  if (isAuthRoute && isLoggedIn) {
    const insightsUrl = new URL("/insights", req.url);
    return NextResponse.redirect(insightsUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/insights/:path*",
    "/collections/:path*",
    "/pos/:path*",
    "/clientele/:path*",
    "/analytics/:path*",
    "/staff/:path*",
    "/settings/:path*",
    "/login",
    "/register",
    "/verify-email",
  ],
};
