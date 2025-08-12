import { NextRequest } from "next/server";
import { fetchTrendingMovies, searchMovies, mapTmdbToNewMovie } from "~/lib/tmdb";
import { saveMovie } from "~/lib/mongo";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const { mode, query, page } = (await request.json()) as {
      mode?: "trending" | "search";
      query?: string;
      page?: number;
    };

    const effectiveMode = mode ?? (query ? "search" : "trending");
    const effectivePage = page ?? 1;

    const tmdbMovies =
      effectiveMode === "trending"
        ? await fetchTrendingMovies(effectivePage)
        : await searchMovies(query ?? "", effectivePage);

    const newMovies = tmdbMovies.map(mapTmdbToNewMovie);

    // Persist in Mongo
    for (const movie of newMovies) {
      await saveMovie(movie);
    }

    return Response.json({ success: true, imported: newMovies.length });
  } catch (error) {
    return Response.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}


