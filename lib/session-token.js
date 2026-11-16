import { SignJWT, jwtVerify } from "jose";

function getSessionKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret?.trim()) {
    throw new Error("SESSION_SECRET 未配置");
  }
  return new TextEncoder().encode(secret);
}

export async function encrypt(payload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSessionKey());
}

export async function decrypt(token) {
  try {
    const { payload } = await jwtVerify(token, getSessionKey(), {
      algorithms: ["HS256"],
    });
    return payload;
  } catch {
    return null;
  }
}
