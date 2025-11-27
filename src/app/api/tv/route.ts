import { NextRequest } from "next/server";
import { 
  getTVShow,
  getAllTVShows,
  updateTVShowVote,
  saveTVShow,
  TVShowData,
  getUserVote
} from "~/lib/firestore";
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
    const searchParams = request.nextUrl.searchParams;
    const searchTerm = searchParams.get('search');
    
    let tvShows = await getAllTVShows();
    
    // Filter by search term if provided
    if (searchTerm) {
      tvShows = tvShows.filter(show => 
        show.title?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort by most recent first and ensure proper data structure
    const sortedShows = tvShows
      .filter((show): show is TVShowData & { id: string; _id?: string } => Boolean(show && show.title))
      .sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0);
        return dateB.getTime() - dateA.getTime();
      })
      .map(show => ({
        ...show,
        id: show.id || show._id || '',
        _id: show.id || show._id || '', // For backward compatibility
        contractId: show.contractId || undefined, // Include contractId if it exists
        isTVShow: true,
        commentCount: show.commentCount || 0,
        votes: show.votes || { yes: 0, no: 0 },
        createdAt: show.createdAt?.toDate ? show.createdAt.toDate().toISOString() : new Date().toISOString(),
        updatedAt: show.updatedAt?.toDate ? show.updatedAt.toDate().toISOString() : new Date().toISOString(),
        firstAirDate: show.firstAirDate,
        lastAirDate: show.lastAirDate,
        numberOfSeasons: show.numberOfSeasons,
        numberOfEpisodes: show.numberOfEpisodes
      }));

    return Response.json({ 
      success: true, 
      tvShows: sortedShows 
    });
  } catch (error) {
    console.error('Error in GET /api/tv:', error);
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
      // Accept either wallet address or Farcaster fid
      const userIdentifier = body.userAddress || (session?.user?.fid ? session.user.fid.toString() : null);
      
      if (!userIdentifier) {
        console.error('No user identifier found (wallet address or Farcaster fid)');
        return Response.json(
          { 
            success: false, 
            error: 'User not authenticated. Please connect your wallet or sign in with Farcaster.' 
          },
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
