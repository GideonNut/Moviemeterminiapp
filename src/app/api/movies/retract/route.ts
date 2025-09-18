import { NextResponse } from "next/server";
import { Movie } from "~/lib/mongo";

export const runtime = "nodejs";

export async function POST() {
  try {
    // Find and delete movies created in the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const result = await Movie.deleteMany({
      createdAt: { $gte: oneHourAgo }
    });

    return NextResponse.json({ 
      success: true, 
      message: `Retracted ${result.deletedCount} recently imported movies`,
      deletedCount: result.deletedCount 
    });
  } catch (error) {
    console.error('Error retracting movies:', error);
    return NextResponse.json({ 
      success: false, 
      error: (error as Error).message 
    }, { status: 500 });
  }
}