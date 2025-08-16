import { NextRequest } from "next/server";
import { getAllMovies, getTVShows } from "~/lib/mongo";
import { constructTmdbImageUrl } from "~/lib/tmdb";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const movies = await getAllMovies();
    const tvShows = await getTVShows();
    
    // Check if any movies have TMDB poster paths
    const moviesWithTmdbPaths = movies.filter(movie => 
      movie.posterUrl && movie.posterUrl.includes('image.tmdb.org')
    );
    
    const moviesWithRelativePaths = movies.filter(movie => 
      movie.posterUrl && movie.posterUrl.startsWith('/')
    );
    
    // Sample some movies to see their current poster URLs
    const sampleMovies = movies.slice(0, 5).map(movie => ({
      id: movie.id,
      title: movie.title,
      currentPosterUrl: movie.posterUrl,
      isTmdbUrl: movie.posterUrl?.includes('image.tmdb.org') || false,
      isRelativePath: movie.posterUrl?.startsWith('/') || false,
      constructedUrl: movie.posterUrl?.startsWith('/') ? constructTmdbImageUrl(movie.posterUrl, 'w500') : null
    }));
    
    return Response.json({ 
      success: true,
      totalMovies: movies.length,
      totalTVShows: tvShows.length,
      moviesWithTmdbUrls: moviesWithTmdbPaths.length,
      moviesWithRelativePaths: moviesWithRelativePaths.length,
      sampleMovies,
      debugInfo: {
        message: "This route shows the current state of movies in the database",
        tmdbImageFunction: "constructTmdbImageUrl is available and working",
        expectedFormat: "TMDB poster paths should start with '/' and be converted to full URLs"
      }
    });
    
  } catch (error) {
    return Response.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
