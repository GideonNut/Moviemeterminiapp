import { NextRequest } from "next/server";
import { fetchAdminStats } from "~/lib/admin-stats";
import { requireAdminPasscode } from "~/lib/admin-passcode";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const denied = requireAdminPasscode(request);
  if (denied) {
    return denied;
  }

  try {
    const stats = await fetchAdminStats();
    return Response.json({ success: true, stats });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return Response.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
