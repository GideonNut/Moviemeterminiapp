import { NextRequest } from "next/server";
import {
  getTVShow,
  getAllTVShows,
  updateTVShowVote,
  saveTVShow,
  TVShowData,
  getUserVote,
} from "~/lib/firestore";
import { buildTmdbTVFeed } from "~/lib/tmdb-feed";
import { getServerSession } from "next-auth/next";
import { authOptions } from "~/auth";

// Mock function for backward compatibility
const getUserVotes = async (userAddress: string) => {
  // In a real implementation, you would query Firestore for user's votes
  return {};
};

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const searchTerm = request.nextUrl.searchParams.get("search");
    const firestoreShows = await getAllTVShows();
    const tvShows = await buildTmdbTVFeed({
      searchTerm,
      firestoreShows,
    });

    return Response.json({
      success: true,
      tvShows,
      source: "tmdb",
    });
  } catch (error) {
    console.error("Error in GET /api/tv:", error);
    return Response.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    
    if (body.action === "add") {
      // For "add" action, require authentication
      if (!session?.user?.email) {
        return Response.json(
          { success: false, error: 'Not authenticated' }, 
          { status: 401 }
        );
      }
      const showData: Omit<TVShowData, 'createdAt' | 'updatedAt' | 'votes'> = {
        ...body.show,
        tmdbId: body.show.id.toString(),
        isTVShow: true,
        addedBy: session.user.email,
        votes: { yes: 0, no: 0 },
        commentCount: 0
      };
      
      await saveTVShow(showData);
      return Response.json({ success: true, showId: showData.tmdbId });
      
    } else if (body.action === "vote") {
      // MiniPay: identity = wallet address only
      const userIdentifier = body.userAddress || session?.user?.address || null;
      
      if (!userIdentifier) {
        return Response.json(
          { success: false, error: 'Wallet address required. Open in MiniPay.' },
          { status: 401 }
        );
      }
      
      console.log('Processing vote for user:', userIdentifier, 'on TV show:', body.id);
      
      // Check if user has already voted for this show
      const userVote = await getUserVote(userIdentifier, body.id, true); // true for TV shows
      if (userVote) {
        return Response.json(
          { success: false, error: 'You have already voted for this show' },
          { status: 400 }
        );
      }
      
      // Update the vote count in Firestore and record the user's vote
      await updateTVShowVote(body.id, body.type, userIdentifier);
      
      return Response.json({ success: true });
      
    } else if (body.action === "getUserVotes") {
      // For now, return empty array as we're not tracking user votes separately
      return Response.json({ success: true, userVotes: [] });
      
    } else {
      return Response.json(
        { success: false, error: "Invalid action" }, 
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error in POST /api/tv:', error);
    return Response.json(
      { success: false, error: (error as Error).message }, 
      { status: 500 }
    );
  }
}
