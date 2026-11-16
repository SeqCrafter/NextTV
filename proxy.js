import { NextResponse } from "next/server";
import { decrypt } from "@/lib/session-token";

const publicRoutes = ["/login"];
const publicAssets = ["/logo.png", "/favicon.ico", "/sitemap.xml", "/robots.txt"];

export async function proxy(request) {
  const { pathname } = request.nextUrl;

  if (
    pathname === "/api" ||
    pathname.startsWith("/api/") ||
    pathname === "/_next" ||
    pathname.startsWith("/_next/") ||
    publicAssets.includes(pathname)
  ) {
    return NextResponse.next();
  }

  if (!process.env.SESSION_SECRET?.trim()) {
    return NextResponse.json(
      { error: "会话配置错误：未设置 SESSION_SECRET" },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }

  const sessionCookie = request.cookies.get("session")?.value;
  const isPublicRoute = publicRoutes.includes(pathname);
  const session = sessionCookie ? await decrypt(sessionCookie) : null;

  if (isPublicRoute && session) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (!isPublicRoute) {
    if (!sessionCookie) {
      const url = new URL("/login", request.url);
      url.searchParams.set("error", "unauthenticated");
      return NextResponse.redirect(url);
    }

    if (!session) {
      const response = NextResponse.redirect(
        new URL("/login?error=expired", request.url),
      );
      response.cookies.delete("session");
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api(?:/|$)|_next(?:/|$)|logo\\.png$|favicon\\.ico$|sitemap\\.xml$|robots\\.txt$).*)",
  ],
};
