import { NextRequest } from "next/server";
import { requireAdminPasscode } from "~/lib/admin-passcode";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const denied = requireAdminPasscode(request);
  if (denied) {
    return denied;
  }

  return Response.json({ success: true });
}
