import { NextRequest } from "next/server";
import {
  hasValidAdminSession,
  isAdminPasscodeConfigured,
} from "~/lib/admin-passcode";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  return Response.json({
    success: true,
    configured: isAdminPasscodeConfigured(),
    authenticated: hasValidAdminSession(request),
  });
}
