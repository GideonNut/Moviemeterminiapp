import { NextResponse } from "next/server";
import { Movie } from "~/lib/mongo";

export const runtime = "nodejs";

export async function POST() {
  try {
    // Find and delete TV shows created in the last 48 hours
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const result = await Movie.deleteMany({
      createdAt: { $gte: fortyEightHoursAgo },
      isTVShow: true,
    });

    return NextResponse.json({
      success: true,
      message: `Retracted ${result.deletedCount} recently imported TV shows`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error('Error retracting TV shows:', error);
    return NextResponse.json({
      success: false,
      error: (error as Error).message,
    }, { status: 500 });
  }
}
