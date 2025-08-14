import { NextRequest } from "next/server";
import { connectMongo } from "~/lib/mongo";

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
    
    return Response.json({ 
      success: true, 
      message: "MongoDB connected successfully",
      connectionState: connection.readyState,
      databaseName: connection.db?.databaseName || "Unknown"
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
