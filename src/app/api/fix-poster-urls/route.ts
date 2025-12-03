import { NextRequest } from "next/server";
import { getAllMovies, getAllTVShows, updatePosterUrl } from "~/lib/firestore";
import { constructTmdbImageUrl } from "~/lib/tmdb";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();
    
    if (action === "fix") {
      // Get all movies and TV shows
      const movies = await getAllMovies();
      const tvShows = await getAllTVShows();
      const allContent = [
        ...movies.map(movie => ({ ...movie, isTVShow: false })),
        ...tvShows.map(show => ({ ...show, isTVShow: true }))
      ];
      
      let fixedCount = 0;
      const errors = [];
      
      for (const item of allContent) {
        try {
          // Check if poster URL is a relative TMDB path
          if (item.posterUrl && item.posterUrl.startsWith('/') && !item.posterUrl.startsWith('http')) {
            // Convert to full URL
            const fullUrl = constructTmdbImageUrl(item.posterUrl, 'w500');
            
            if (fullUrl) {
              const documentId = item.id || item.tmdbId;
              if (!documentId) {
                continue;
              }

              await updatePosterUrl(documentId, fullUrl, Boolean(item.isTVShow));
              fixedCount++;
              console.log(`Fixed poster URL for ${item.title}: ${item.posterUrl} -> ${fullUrl}`);
            }
          }
        } catch (error) {
          errors.push({
            itemId: item.id,
            title: item.title,
            error: error instanceof Error ? error.message : "Unknown error"
          });
        }
      }
      
      return Response.json({
        success: true,
        message: `Fixed ${fixedCount} poster URLs`,
        fixedCount,
        errors,
        totalContent: allContent.length
      });
    }
    
    return Response.json({ 
      success: false, 
      error: "Invalid action. Use 'fix' to fix poster URLs." 
    });
    
  } catch (error) {
    console.error("Fix poster URLs failed:", error);
    
    return Response.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const movies = await getAllMovies();
    const tvShows = await getAllTVShows();
    const allContent = [...movies, ...tvShows];
    
    // Analyze current poster URL status
    const analysis = {
      totalContent: allContent.length,
      withPosterUrl: allContent.filter(item => item.posterUrl).length,
      withRelativePaths: allContent.filter(item => 
        item.posterUrl && item.posterUrl.startsWith('/') && !item.posterUrl.startsWith('http')
      ).length,
      withFullUrls: allContent.filter(item => 
        item.posterUrl && (item.posterUrl.startsWith('http://') || item.posterUrl.startsWith('https://'))
      ).length,
      withTmdbUrls: allContent.filter(item => 
        item.posterUrl && item.posterUrl.includes('image.tmdb.org')
      ).length,
      sampleItems: allContent.slice(0, 5).map(item => ({
        id: item.id,
        title: item.title,
        posterUrl: item.posterUrl,
        isRelative: item.posterUrl?.startsWith('/') && !item.posterUrl?.startsWith('http'),
        isFullUrl: item.posterUrl?.startsWith('http'),
        isTmdbUrl: item.posterUrl?.includes('image.tmdb.org')
      }))
    };
    
    return Response.json({
      success: true,
      analysis,
      message: "Use POST with action: 'fix' to fix relative poster URLs"
    });
    
  } catch (error) {
    return Response.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}
