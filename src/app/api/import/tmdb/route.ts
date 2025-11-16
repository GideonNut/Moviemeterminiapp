import { NextRequest } from "next/server";
import { 
  fetchTrendingMovies, 
  searchMovies, 
  fetchTrendingTVShows, 
  searchTVShows, 
  mapTmdbToNewMovie 
} from "~/lib/tmdb";
import { adminDb } from "~/lib/firebase-admin";
import { Timestamp } from "firebase-admin/firestore";

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

    // Persist in Firestore and collect titles
    const importedTitles: string[] = [];
    const batch = adminDb.batch();
    const collection = adminDb.collection(newContent[0].isTVShow ? 'tvShows' : 'movies');
    
    for (const item of newContent) {
      const docRef = collection.doc();
      const data = {
        ...item,
        votes: { yes: 0, no: 0 },
        commentCount: 0,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };
      batch.set(docRef, data);
      if (item.title) importedTitles.push(item.title);
    }
    
    await batch.commit();

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


