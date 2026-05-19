import { timingSafeEqual } from "crypto";
import type { NextRequest } from "next/server";
import {
  getAdminAuthTokenFromRequest,
  verifyAdminAuthToken,
} from "~/lib/admin-auth-cookie";

export const ADMIN_PASSCODE_HEADER = "x-admin-passcode";

/** @deprecated Use ADMIN_PASSCODE */
const LEGACY_ENV_KEY = "ADMIN_STATS_PASSCODE";

export function getAdminPasscodeFromEnv(): string | undefined {
  return process.env.ADMIN_PASSCODE || process.env[LEGACY_ENV_KEY];
}

export function getAdminPasscodeHeaderName() {
  return ADMIN_PASSCODE_HEADER;
}

export function isAdminPasscodeConfigured(): boolean {
  return Boolean(getAdminPasscodeFromEnv());
}

export function verifyAdminPasscode(
  provided: string | null | undefined
): boolean {
  const expected = getAdminPasscodeFromEnv();
  if (!expected || !provided) {
    return false;
  }

  try {
    const a = Buffer.from(provided, "utf8");
    const b = Buffer.from(expected, "utf8");
    if (a.length !== b.length) {
      return false;
    }
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function getPasscodeFromRequest(request: NextRequest): string | null {
  return (
    request.headers.get(ADMIN_PASSCODE_HEADER) ??
    request.nextUrl.searchParams.get("passcode")
  );
}

export function adminPasscodeUnauthorized() {
  return Response.json(
    { success: false, error: "Invalid or missing passcode." },
    { status: 401 }
  );
}

export function adminPasscodeNotConfigured() {
  return Response.json(
    {
      success: false,
      error: "ADMIN_PASSCODE is not configured on the server.",
    },
    { status: 503 }
  );
}

export function hasValidAdminSession(request: NextRequest): boolean {
  return verifyAdminAuthToken(getAdminAuthTokenFromRequest(request));
}

/** Returns a Response when the request should be rejected, otherwise null. */
export function requireAdminPasscode(request: NextRequest): Response | null {
  if (!isAdminPasscodeConfigured()) {
    return adminPasscodeNotConfigured();
  }

  if (hasValidAdminSession(request)) {
    return null;
  }

  if (!verifyAdminPasscode(getPasscodeFromRequest(request))) {
    return adminPasscodeUnauthorized();
  }

  return null;
}
