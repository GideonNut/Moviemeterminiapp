import { NextRequest } from "next/server";
import { getAllMovies, getTVShows } from "~/lib/mongo";
import { constructTmdbImageUrl } from "~/lib/tmdb";
import mongoose from "mongoose";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();
    
    if (action === "fix") {
      // Get all movies and TV shows
      const movies = await getAllMovies();
      const tvShows = await getTVShows();
      const allContent = [...movies, ...tvShows];
      
      let fixedCount = 0;
      let errors = [];
      
      // Connect to MongoDB
      await mongoose.connect(process.env.MONGODB_URI!);
      const db = mongoose.connection.db;
      
      if (!db) {
        throw new Error("Failed to get database connection");
      }
      
      for (const item of allContent) {
        try {
          // Check if poster URL is a relative TMDB path
          if (item.posterUrl && item.posterUrl.startsWith('/') && !item.posterUrl.startsWith('http')) {
            // Convert to full URL
            const fullUrl = constructTmdbImageUrl(item.posterUrl, 'w500');
            
            if (fullUrl) {
              // Update in database
              const collection = item.isTVShow ? 'movies' : 'movies'; // Both use movies collection
              
              // Ensure _id exists and is valid
              if (item._id) {
                await db.collection(collection).updateOne(
                  { _id: item._id },
                  { $set: { posterUrl: fullUrl } }
                );
                
                fixedCount++;
                console.log(`Fixed poster URL for ${item.title}: ${item.posterUrl} -> ${fullUrl}`);
              }
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
    const tvShows = await getTVShows();
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
