import { NextRequest } from "next/server";
import { getTVShows } from "../../../lib/mongo";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const tvShows = await getTVShows();
    return Response.json({ success: true, tvShows });
  } catch (error) {
    return Response.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
