import { NextRequest } from "next/server";
import { saveVote } from "../../../lib/kv";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const { movieId, vote } = await request.json();
    if (typeof movieId !== "string" || typeof vote !== "boolean") {
      return Response.json({ success: false, error: "Invalid input" }, { status: 400 });
    }
    await saveVote(movieId, vote ? "yes" : "no");
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
} 