import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;

  const isAuthRoute = pathname.startsWith("/login");

  // In production, force login. In development/demo, allow seamless exploration.
  if (process.env.NODE_ENV === "production") {
    const isDashboardRoute =
      pathname.startsWith("/insights") ||
      pathname.startsWith("/collections") ||
      pathname.startsWith("/pos") ||
      pathname.startsWith("/clientele") ||
      pathname.startsWith("/analytics");

    if (isDashboardRoute && !isLoggedIn) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    if (isAuthRoute && isLoggedIn) {
      return NextResponse.redirect(new URL("/insights", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/insights/:path*",
    "/collections/:path*",
    "/pos/:path*",
    "/clientele/:path*",
    "/analytics/:path*",
    "/login",
  ],
};
