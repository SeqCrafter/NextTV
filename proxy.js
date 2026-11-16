import { NextResponse } from "next/server";
import { decrypt } from "@/lib/session";

const publicRoutes = ["/login"];

export async function proxy(request) {
  const { pathname } = request.nextUrl;

  // Skip static assets and API routes
  if (
    pathname === "/logo.png" ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/favicon.ico")
  ) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get("session")?.value;
  const isPublicRoute = publicRoutes.includes(pathname);

  // If visiting login page while already authenticated, redirect to home
  if (isPublicRoute && sessionCookie) {
    const session = await decrypt(sessionCookie);
    if (session) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // If visiting protected route without valid session, redirect to login
  if (!isPublicRoute) {
    if (!sessionCookie) {
      const url = new URL("/login", request.url);
      url.searchParams.set("error", "unauthenticated");
      return NextResponse.redirect(url);
    }

    const session = await decrypt(sessionCookie);
    if (!session) {
      // Cookie exists but is invalid or expired
      const response = NextResponse.redirect(
        new URL("/login?error=expired", request.url)
      );
      response.cookies.delete("session");
      return response;
    }
  }

  return NextResponse.next();
}
