import { afterAll, beforeEach, describe, expect, mock, test } from "bun:test";
import { AsyncLocalStorage } from "node:async_hooks";
import { readFile } from "node:fs/promises";
import { SignJWT } from "jose";

const originalSecret = process.env.SESSION_SECRET;
const testSecret = "nexttv-test-secret-".repeat(4);
globalThis.AsyncLocalStorage ??= AsyncLocalStorage;

const { NextRequest } = await import("next/server");
const testing = await import("next/experimental/testing/server");
const doesProxyMatch = testing.unstable_doesProxyMatch ?? testing.unstable_doesMiddlewareMatch;
const { proxy, config } = await import("../proxy.js");
const { encrypt, decrypt } = await import("../lib/session-token.js");

let requestHeaders;
let writtenCookie;
let deletedCookie;
mock.module("next/headers", () => ({
  headers: async () => requestHeaders,
  cookies: async () => ({
    set: (...args) => { writtenCookie = args; },
    delete: (name) => { deletedCookie = name; },
  }),
}));
const { createSession, deleteSession, shouldUseSecureCookie } = await import("../lib/session.js");

beforeEach(() => {
  process.env.SESSION_SECRET = testSecret;
  requestHeaders = new Headers({ "x-forwarded-proto": "https" });
  writtenCookie = undefined;
  deletedCookie = undefined;
});

afterAll(() => {
  if (originalSecret === undefined) delete process.env.SESSION_SECRET;
  else process.env.SESSION_SECRET = originalSecret;
});

function request(path, token) {
  return new NextRequest(`https://nexttv.example${path}`, {
    headers: token ? { cookie: `session=${token}` } : undefined,
  });
}

async function signedToken(algorithm = "HS256", expiration = "7d") {
  return await new SignJWT({ authenticated: true })
    .setProtectedHeader({ alg: algorithm })
    .setIssuedAt()
    .setExpirationTime(expiration)
    .sign(new TextEncoder().encode(testSecret));
}

describe("会话 Token", () => {
  test("保持 HS256 签名与 7 天有效期", async () => {
    const expiresAt = new Date(Date.now() + 7 * 86400000).toISOString();
    const token = await encrypt({ authenticated: true, expiresAt });
    const payload = await decrypt(token);
    expect(payload.authenticated).toBe(true);
    expect(payload.expiresAt).toBe(expiresAt);
    expect(payload.exp - payload.iat).toBe(7 * 86400);
  });

  test("拒绝畸形、篡改、过期和非 HS256 Token", async () => {
    const token = await encrypt({ authenticated: true });
    const parts = token.split(".");
    parts[2] = (parts[2][0] === "A" ? "B" : "A") + parts[2].slice(1);
    expect(await decrypt("not-a-jwt")).toBeNull();
    expect(await decrypt(parts.join("."))).toBeNull();
    expect(await decrypt(await signedToken("HS256", Math.floor(Date.now() / 1000) - 60))).toBeNull();
    expect(await decrypt(await signedToken("HS384"))).toBeNull();
  });

  test("密钥改变后旧 Token 不再有效", async () => {
    const token = await encrypt({ authenticated: true });
    process.env.SESSION_SECRET = "another-test-secret".repeat(4);
    expect(await decrypt(token)).toBeNull();
  });

  test("未配置或空白密钥时不签发 Token", async () => {
    for (const secret of [undefined, "", "  "]) {
      if (secret === undefined) delete process.env.SESSION_SECRET;
      else process.env.SESSION_SECRET = secret;
      await expect(encrypt({ authenticated: true })).rejects.toThrow("SESSION_SECRET 未配置");
      expect(await decrypt("invalid")).toBeNull();
    }
  });

  test("Token 模块只有 jose 依赖，Proxy 不再导入服务端会话模块", async () => {
    const tokenSource = await readFile(new URL("../lib/session-token.js", import.meta.url), "utf8");
    const proxySource = await readFile(new URL("../proxy.js", import.meta.url), "utf8");
    expect([...tokenSource.matchAll(/from\s+["']([^"']+)["']/g)].map((match) => match[1])).toEqual(["jose"]);
    expect(proxySource).toContain('from "@/lib/session-token"');
    expect(proxySource).not.toContain('from "@/lib/session"');
    expect(tokenSource).not.toContain("next/headers");
  });

  test("Token 模块可打包为浏览器/Web Crypto 目标", async () => {
    const result = await Bun.build({
      entrypoints: [new URL("../lib/session-token.js", import.meta.url).pathname],
      target: "browser",
      write: false,
    });
    expect(result.success).toBe(true);
    const output = await result.outputs[0].text();
    expect(output).not.toContain("next/headers");
    expect(output).not.toContain("DYNAMIC_SERVER_USAGE");
  });
});

describe("Proxy 鉴权与 matcher", () => {
  test("所有页面仍需要经过鉴权，包括带点的播放 ID", () => {
    for (const url of ["/", "/login", "/search", "/settings", "/help", "/source-browse", "/direct", "/direct-input", "/play/123", "/play/123.png", "/apiary"]) {
      expect(doesProxyMatch({ config, url })).toBe(true);
    }
  });

  test("API、Next 静态资源和公共文件不执行 Proxy", async () => {
    delete process.env.SESSION_SECRET;
    for (const url of ["/api", "/api/search?q=test", "/_next/static/chunks/test.js", "/_next/image?url=test", "/logo.png", "/favicon.ico", "/sitemap.xml", "/robots.txt"]) {
      expect(doesProxyMatch({ config, url })).toBe(false);
      expect((await proxy(request(url))).headers.get("x-middleware-next")).toBe("1");
    }
  });

  test("未登录页面跳转到登录页，登录页本身可访问", async () => {
    const response = await proxy(request("/settings"));
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://nexttv.example/login?error=unauthenticated");
    expect((await proxy(request("/login"))).headers.get("x-middleware-next")).toBe("1");
  });

  test("有效会话允许访问页面，并从登录页跳转首页", async () => {
    const token = await encrypt({ authenticated: true });
    expect((await proxy(request("/settings", token))).headers.get("x-middleware-next")).toBe("1");
    expect((await proxy(request("/login", token))).headers.get("location")).toBe("https://nexttv.example/");
  });

  test("无效或过期 Cookie 被删除，但登录页不会形成重定向循环", async () => {
    for (const token of ["invalid", await signedToken("HS256", Math.floor(Date.now() / 1000) - 60)]) {
      const response = await proxy(request("/", token));
      expect(response.headers.get("location")).toBe("https://nexttv.example/login?error=expired");
      expect(response.headers.get("set-cookie")).toContain("session=;");
      expect((await proxy(request("/login", token))).headers.get("x-middleware-next")).toBe("1");
    }
  });

  test("缺少密钥时明确返回不缓存的 500，不绕过鉴权", async () => {
    for (const secret of [undefined, "", "  "]) {
      if (secret === undefined) delete process.env.SESSION_SECRET;
      else process.env.SESSION_SECRET = secret;
      for (const path of ["/", "/login"]) {
        const response = await proxy(request(path));
        expect(response.status).toBe(500);
        expect(response.headers.get("cache-control")).toBe("no-store");
        expect(await response.json()).toEqual({ error: "会话配置错误：未设置 SESSION_SECRET" });
      }
    }
  });
});

describe("服务端 Cookie 行为", () => {
  test("保留 HTTPS/HTTP 代理协议识别", () => {
    expect(shouldUseSecureCookie(new Headers({ "x-forwarded-proto": " HTTPS, http " }))).toBe(true);
    expect(shouldUseSecureCookie(new Headers({ "x-forwarded-proto": "http" }))).toBe(false);
    expect(shouldUseSecureCookie(new Headers())).toBe(process.env.NODE_ENV === "production");
  });

  test("创建 Cookie 保留会话内容与安全选项", async () => {
    await createSession();
    const [name, token, options] = writtenCookie;
    expect(name).toBe("session");
    expect((await decrypt(token)).authenticated).toBe(true);
    expect(options).toMatchObject({ httpOnly: true, secure: true, sameSite: "lax", path: "/" });
    expect(options.expires).toBeInstanceOf(Date);
  });

  test("HTTP 不设置 Secure，退出删除相同 Cookie", async () => {
    requestHeaders = new Headers({ "x-forwarded-proto": "http" });
    await createSession();
    expect(writtenCookie[2].secure).toBe(false);
    await deleteSession();
    expect(deletedCookie).toBe("session");
  });
});
