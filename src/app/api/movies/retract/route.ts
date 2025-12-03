import { NextResponse } from "next/server";
import { deleteRecentMovies } from "~/lib/firestore";

export const runtime = "nodejs";

export async function POST() {
  try {
    const deletedCount = await deleteRecentMovies(48);

    return NextResponse.json({ 
      success: true, 
      message: `Retracted ${deletedCount} recently imported movies`,
      deletedCount 
    });
  } catch (error) {
    console.error('Error retracting movies:', error);
    return NextResponse.json({ 
      success: false, 
      error: (error as Error).message 
    }, { status: 500 });
  }
}