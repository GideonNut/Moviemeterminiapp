import { NextRequest } from "next/server";
import { getAllMovies, saveMovie, saveVote, resetMovieIds, getUserVotes } from "../../../lib/mongo";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const movies = await getAllMovies();
    return Response.json({ success: true, movies });
  } catch (error) {
    return Response.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (body.action === "add") {
      const result = await saveMovie(body.movie);
      return Response.json({ success: true, movieId: result.id });
    } else if (body.action === "vote") {
      await saveVote(body.id, body.type, body.userAddress);
      return Response.json({ success: true });
    } else if (body.action === "getUserVotes") {
      const userVotes = await getUserVotes(body.userAddress);
      return Response.json({ success: true, userVotes });
    } else if (body.action === "reset") {
      await resetMovieIds();
      return Response.json({ success: true, message: "Movie IDs reset successfully" });
    } else {
      return Response.json({ success: false, error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    return Response.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}