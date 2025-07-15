import { NextRequest } from "next/server";
import { saveMovie } from "../../../lib/kv";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const movie = await request.json();
    if (!movie || typeof movie !== "object" || !movie.title) {
      return Response.json({ success: false, error: "Invalid movie data" }, { status: 400 });
    }
    await saveMovie(movie);
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
} 