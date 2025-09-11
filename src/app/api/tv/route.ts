import { NextRequest } from "next/server";
import { getTVShows, saveVote, getUserVotes, addVotePoints } from "../../../lib/mongo";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const tvShows = await getTVShows();
    return Response.json({ success: true, tvShows });
  } catch (error) {
    return Response.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (body.action === "vote") {
      await saveVote(body.id, body.type, body.userAddress);
      // Award 1 point for voting
      await addVotePoints(body.userAddress);
      return Response.json({ success: true });
    } else if (body.action === "getUserVotes") {
      const userVotes = await getUserVotes(body.userAddress);
      return Response.json({ success: true, userVotes });
    } else {
      return Response.json({ success: false, error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    return Response.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
