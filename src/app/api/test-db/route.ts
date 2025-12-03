import { testFirestoreConnection } from "~/lib/firestore";
import { constructTmdbImageUrl, constructPosterUrl, constructBackdropUrl } from "~/lib/tmdb";

export const runtime = "nodejs";

export async function GET() {
  try {
    console.log("Testing Firestore connection...");
    await testFirestoreConnection();
    
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
      message: "Firestore connection verified successfully",
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
