import { NextRequest } from "next/server";
import { fetchTrendingMovies, searchMovies, mapTmdbToNewMovie } from "~/lib/tmdb";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    // Test TMDB API connection and data fetching
    console.log("Testing TMDB API connection...");
    
    // Test 1: Fetch trending movies
    let trendingMovies;
    try {
      trendingMovies = await fetchTrendingMovies(1);
      console.log(`Successfully fetched ${trendingMovies.length} trending movies`);
    } catch (error) {
      console.error("Error fetching trending movies:", error);
      trendingMovies = null;
    }
    
    // Test 2: Test image URL construction with real data
    let imageUrlTests: Array<{
      originalPath: string | null | undefined;
      mappedPosterUrl: string | undefined;
      isFullUrl: boolean;
      isTmdbUrl: boolean;
    }> = [];
    
    if (trendingMovies && trendingMovies.length > 0) {
      const sampleMovie = trendingMovies[0];
      console.log("Sample movie data:", {
        id: sampleMovie.id,
        title: sampleMovie.title,
        poster_path: sampleMovie.poster_path
      });
      
      // Test mapping function
      const mappedMovie = mapTmdbToNewMovie(sampleMovie);
      console.log("Mapped movie:", {
        id: mappedMovie.id,
        title: mappedMovie.title,
        posterUrl: mappedMovie.posterUrl
      });
      
      imageUrlTests = [
        {
          originalPath: sampleMovie.poster_path,
          mappedPosterUrl: mappedMovie.posterUrl,
          isFullUrl: mappedMovie.posterUrl?.startsWith('http') || false,
          isTmdbUrl: mappedMovie.posterUrl?.includes('image.tmdb.org') || false
        }
      ];
    }
    
    // Test 3: Check environment variables
    const hasApiKey = !!process.env.TMDB_API_KEY;
    const apiKeyLength = process.env.TMDB_API_KEY?.length || 0;
    
    return Response.json({ 
      success: true,
      movies: trendingMovies || [], // Return actual movie data for testing
      tmdbApiStatus: {
        hasApiKey,
        apiKeyLength,
        apiKeyPreview: hasApiKey ? `${process.env.TMDB_API_KEY?.substring(0, 10)}...` : 'Not set'
      },
      trendingMoviesTest: {
        success: !!trendingMovies,
        count: trendingMovies?.length || 0,
        error: trendingMovies ? null : "Failed to fetch trending movies"
      },
      imageUrlTests,
      debugInfo: {
        message: "TMDB API test completed",
        nextSteps: "Check if trending movies were fetched and image URLs constructed correctly"
      }
    });
    
  } catch (error) {
    console.error("TMDB test failed:", error);
    
    return Response.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
