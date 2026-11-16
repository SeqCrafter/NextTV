import { cookies, headers } from "next/headers";
import { encrypt } from "@/lib/session-token";

export { encrypt, decrypt } from "@/lib/session-token";

const COOKIE_NAME = "session";

export function shouldUseSecureCookie(requestHeaders) {
  const forwardedProtocol = requestHeaders
    .get("x-forwarded-proto")
    ?.split(",")[0]
    .trim()
    .toLowerCase();

  return forwardedProtocol
    ? forwardedProtocol === "https"
    : process.env.NODE_ENV === "production";
}

export async function createSession() {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const session = await encrypt({ authenticated: true, expiresAt });

  const requestHeaders = await headers();

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, session, {
    httpOnly: true,
    secure: shouldUseSecureCookie(requestHeaders),
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
