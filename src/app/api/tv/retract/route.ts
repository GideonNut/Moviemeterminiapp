import { NextResponse } from "next/server";
import { deleteRecentTVShows } from "~/lib/firestore";

export const runtime = "nodejs";

export async function POST() {
  try {
    const deletedCount = await deleteRecentTVShows(48);

    return NextResponse.json({
      success: true,
      message: `Retracted ${deletedCount} recently imported TV shows`,
      deletedCount,
    });
  } catch (error) {
    console.error('Error retracting TV shows:', error);
    return NextResponse.json({
      success: false,
      error: (error as Error).message,
    }, { status: 500 });
  }
}
