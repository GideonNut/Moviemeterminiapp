import { NextRequest, NextResponse } from "next/server";
import {
  adminAuthCookieOptions,
  ADMIN_AUTH_COOKIE,
  createAdminAuthToken,
} from "~/lib/admin-auth-cookie";
import {
  getPasscodeFromRequest,
  isAdminPasscodeConfigured,
  requireAdminPasscode,
  verifyAdminPasscode,
} from "~/lib/admin-passcode";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!isAdminPasscodeConfigured()) {
    const denied = requireAdminPasscode(request);
    return denied!;
  }

  const passcode = getPasscodeFromRequest(request);
  if (!verifyAdminPasscode(passcode)) {
    const denied = requireAdminPasscode(request);
    return denied!;
  }

  const token = createAdminAuthToken();
  if (!token) {
    return Response.json(
      {
        success: false,
        error:
          "Cannot create admin session. Set NEXTAUTH_SECRET or ADMIN_PASSCODE.",
      },
      { status: 503 }
    );
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set(ADMIN_AUTH_COOKIE, token, adminAuthCookieOptions());
  return response;
}
