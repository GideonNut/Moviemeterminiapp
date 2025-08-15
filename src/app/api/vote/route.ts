import { NextRequest } from "next/server";
import { saveVote } from "../../../lib/mongo";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const { movieId, vote, userAddress } = await request.json();
    if (typeof movieId !== "string" || typeof vote !== "boolean" || typeof userAddress !== "string") {
      return Response.json({ success: false, error: "Invalid input" }, { status: 400 });
    }
    await saveVote(movieId, vote ? "yes" : "no", userAddress);
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
} 