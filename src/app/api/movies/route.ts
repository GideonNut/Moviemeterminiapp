import { NextRequest } from "next/server";
import { 
  saveMovie as saveMovieToFirestore,
  getMovie,
  getAllMovies as getFirestoreMovies,
  updateVote,
  getUserVote,
  type MovieData
} from "~/lib/firestore";
import { getServerSession } from "next-auth/next";
import { authOptions } from "~/auth";

// Mock functions for backward compatibility
const getUserVotes = async (userAddress: string) => {
  // In a real implementation, you would query Firestore for user's votes
  return {};
};

const resetMovieIds = async () => {
  // In a real implementation, you would reset movie IDs in Firestore
  return { success: true };
};

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const searchTerm = searchParams.get('search');
    
    let movies = await getFirestoreMovies();
    
    // Filter by search term if provided
    if (searchTerm) {
      movies = movies.filter(movie => 
        movie.title?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort by most recent first and ensure proper data structure
    const sortedMovies = movies
      .filter((movie): movie is MovieData & { id: string; _id?: string; title?: string } => Boolean(movie && movie?.title)) // Filter out any invalid entries
      .sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0);
        return dateB.getTime() - dateA.getTime();
      })
      .map(movie => ({
        ...movie,
        id: movie.id || movie._id || '',
        _id: movie.id || movie._id || '', // For backward compatibility
        commentCount: movie.commentCount || 0,
        votes: movie.votes || { yes: 0, no: 0 },
        createdAt: movie.createdAt?.toDate ? movie.createdAt.toDate().toISOString() : new Date().toISOString(),
        updatedAt: movie.updatedAt?.toDate ? movie.updatedAt.toDate().toISOString() : new Date().toISOString()
      }));

    return Response.json({ 
      success: true, 
      movies: sortedMovies 
    });
  } catch (error) {
    console.error('Error in GET /api/movies:', error);
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
      const movieData = {
        ...body.movie,
        tmdbId: body.movie.id.toString(),
        createdAt: new Date(),
        updatedAt: new Date(),
        addedBy: session.user.email
      };
      
      await saveMovieToFirestore(movieData);
      return Response.json({ success: true, movieId: movieData.tmdbId });
      
    } else if (body.action === "vote") {
      try {
        // Get the session from the request headers
        const authHeader = request.headers.get('authorization');
        
        if (!authHeader) {
          console.error('No authorization header found');
          return Response.json(
            { 
              success: false, 
              error: 'Not authenticated. Please sign in again.' 
            },
            { status: 401 }
          );
        }
        
        // Get the session using the token from the authorization header
        const token = authHeader.replace('Bearer ', '');
        const session = await getServerSession(authOptions);
        
        if (!session?.user?.fid) {
          console.error('No Farcaster fid found in session');
          return Response.json(
            { 
              success: false, 
              error: 'User not authenticated with Farcaster. Please sign in again.' 
            },
            { status: 401 }
          );
        }
        
        const fid = session.user.fid.toString();
        console.log('Processing vote for FID:', fid, 'on movie:', body.id);
        
        // Check if user has already voted for this movie
        const userVote = await getUserVote(fid, body.id, false); // false for movies
        if (userVote) {
          return Response.json(
            { success: false, error: 'You have already voted for this movie' },
            { status: 400 }
          );
        }
        
        // Update the vote count in Firestore and record the user's vote
        console.log('Updating vote for movie:', body.id, 'with vote:', body.type);
        await updateVote(body.id, body.type, fid);
        console.log('Vote recorded successfully');
        
        return Response.json({ success: true });
      } catch (error: unknown) {
        console.error('Error in vote API:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return Response.json(
          { 
            success: false, 
            error: 'An error occurred while processing your vote',
            details: errorMessage
          },
          { status: 500 }
        );
      }
    } else if (body.action === "getUserVotes") {
      const session = await getServerSession(authOptions);
      if (!session?.user?.fid) {
        return Response.json(
          { success: false, error: 'User not authenticated with Farcaster' },
          { status: 401 }
        );
      }
      const fid = session.user.fid.toString();
      const userVotes = await getUserVotes(fid);
      return Response.json({ success: true, userVotes });
    } else if (body.action === "reset") {
      await resetMovieIds();
      return Response.json({ success: true, message: "Movie IDs reset successfully" });
    } else {
      return Response.json({ success: false, error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    return Response.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}