import { NextRequest, NextResponse } from "next/server";
import { getUserPoints, getAllUserPoints } from "~/lib/mongo";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');

    if (address) {
      // Get points for specific user
      const points = await getUserPoints(address);
      return NextResponse.json({ 
        success: true, 
        points: points || { 
          address, 
          totalPoints: 0, 
          votePoints: 0, 
          commentPoints: 0, 
          lastUpdated: new Date() 
        }
      });
    } else {
      // Get all user points (leaderboard)
      const allPoints = await getAllUserPoints();
      return NextResponse.json({ 
        success: true, 
        points: allPoints 
      });
    }
  } catch (error: any) {
    console.error('Error in points GET:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get points' },
      { status: 500 }
    );
  }
}
