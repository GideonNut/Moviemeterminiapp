import { NextRequest } from "next/server";
import { 
  getTVShow,
  getAllTVShows,
  updateTVShowVote,
  saveTVShow,
  TVShowData
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
    
    let tvShows;
    if (searchTerm) {
      // Implement search if needed
      tvShows = await getAllTVShows();
      tvShows = tvShows.filter(show => 
        show.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    } else {
      tvShows = await getAllTVShows();
    }

    // Sort by most recent first
    const sortedShows = tvShows.sort((a, b) => 
      new Date(b.createdAt?.toDate()).getTime() - new Date(a.createdAt?.toDate()).getTime()
    );

    return Response.json({ 
      success: true, 
      tvShows: sortedShows.map(show => ({
        ...show,
        id: show.id,
        _id: show.id, // For backward compatibility
        commentCount: show.commentCount || 0,
        createdAt: show.createdAt?.toDate().toISOString(),
        updatedAt: show.updatedAt?.toDate().toISOString(),
        firstAirDate: show.firstAirDate,
        lastAirDate: show.lastAirDate,
        numberOfSeasons: show.numberOfSeasons,
        numberOfEpisodes: show.numberOfEpisodes
      }))
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
    if (!session?.user?.email) {
      return Response.json(
        { success: false, error: 'Not authenticated' }, 
        { status: 401 }
      );
    }

    const body = await request.json();
    
    if (body.action === "add") {
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
      if (!body.userAddress) {
        return Response.json(
          { success: false, error: 'User address is required' },
          { status: 400 }
        );
      }
      
      await updateTVShowVote(body.id, body.type);
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
