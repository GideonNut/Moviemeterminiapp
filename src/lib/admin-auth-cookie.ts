import { createHmac, timingSafeEqual } from "crypto";
import type { NextRequest } from "next/server";

export const ADMIN_AUTH_COOKIE = "admin-auth";

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8; // 8 hours

function getSigningSecret(): string | undefined {
  return process.env.NEXTAUTH_SECRET || process.env.ADMIN_PASSCODE;
}

function signPayload(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function createAdminAuthToken(): string | null {
  const secret = getSigningSecret();
  if (!secret) {
    return null;
  }

  const expiresAt = Date.now() + SESSION_MAX_AGE_SECONDS * 1000;
  const payload = `${expiresAt}`;
  const signature = signPayload(payload, secret);
  return `${payload}.${signature}`;
}

export function verifyAdminAuthToken(token: string | null | undefined): boolean {
  const secret = getSigningSecret();
  if (!secret || !token) {
    return false;
  }

  const [expiresRaw, signature] = token.split(".");
  if (!expiresRaw || !signature) {
    return false;
  }

  const expiresAt = Number(expiresRaw);
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) {
    return false;
  }

  const expected = signPayload(expiresRaw, secret);
  try {
    const a = Buffer.from(signature, "utf8");
    const b = Buffer.from(expected, "utf8");
    if (a.length !== b.length) {
      return false;
    }
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function getAdminAuthTokenFromRequest(
  request: NextRequest
): string | null {
  return request.cookies.get(ADMIN_AUTH_COOKIE)?.value ?? null;
}

export function adminAuthCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  };
}
