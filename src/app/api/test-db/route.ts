import { NextRequest } from "next/server";
import { connectMongo } from "~/lib/mongo";
import { constructTmdbImageUrl, constructPosterUrl, constructBackdropUrl } from "~/lib/tmdb";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    console.log("Testing MongoDB connection...");
    
    // Check if environment variable is set
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      return Response.json({ 
        success: false, 
        error: "MONGODB_URI not set",
        message: "Please create a .env.local file with your MongoDB connection string"
      }, { status: 500 });
    }

    // Test connection
    const connection = await connectMongo();
    
    // Test TMDB image URL construction
    const testPosterPath = "/1E5baAaEse26fej7uHcjOgEE2t2.jpg";
    const testBackdropPath = "/backdrop_path_example.jpg";
    const testSvgPath = "/logo_example.svg";
    
    const tmdbTests = {
      posterUrl: constructPosterUrl(testPosterPath, "w500"),
      backdropUrl: constructBackdropUrl(testBackdropPath, "w1280"),
      svgUrl: constructTmdbImageUrl(testSvgPath, "original"),
      customSize: constructTmdbImageUrl(testPosterPath, "w780"),
      nullPath: constructTmdbImageUrl(null),
      undefinedPath: constructTmdbImageUrl(undefined as any)
    };
    
    return Response.json({ 
      success: true, 
      message: "MongoDB connected successfully",
      connectionState: connection.readyState,
      databaseName: connection.db?.databaseName || "Unknown",
      tmdbImageTests: tmdbTests
    });
    
  } catch (error) {
    console.error("Database test failed:", error);
    
    return Response.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error",
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
