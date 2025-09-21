import { NextRequest } from "next/server";
import { 
  fetchTrendingMovies, 
  searchMovies, 
  fetchTrendingTVShows, 
  searchTVShows, 
  mapTmdbToNewMovie 
} from "~/lib/tmdb";
import { saveMovie } from "~/lib/mongo";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const { mode, query, page, mediaType = "movie" } = (await request.json()) as {
      mode?: "trending" | "search";
      query?: string;
      page?: number;
      mediaType?: "movie" | "tv";
    };

    const effectiveMode = mode ?? (query ? "search" : "trending");
    const effectivePage = page ?? 1;

    let tmdbContent;
    if (mediaType === "tv") {
      tmdbContent = effectiveMode === "trending"
        ? await fetchTrendingTVShows(effectivePage)
        : await searchTVShows(query ?? "", effectivePage);
    } else {
      tmdbContent = effectiveMode === "trending"
        ? await fetchTrendingMovies(effectivePage)
        : await searchMovies(query ?? "", effectivePage);
    }

    const newContent = tmdbContent.map((item) => ({
      ...mapTmdbToNewMovie(item),
      isTVShow: mediaType === "tv"
    }));

    // Persist in Mongo and collect titles
    const importedTitles: string[] = [];
    for (const item of newContent) {
      await saveMovie(item);
      if (item.title) importedTitles.push(item.title);
    }

    const mediaTypeLabel = mediaType === "tv" ? "TV shows" : "movies";
    return Response.json({ 
      success: true, 
      imported: newContent.length,
      mediaType: mediaType,
      titles: importedTitles,
      message: `Successfully imported ${newContent.length} ${mediaTypeLabel}`
    });
  } catch (error) {
    return Response.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}


