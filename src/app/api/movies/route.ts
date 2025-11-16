import { NextRequest } from "next/server";
import { 
  saveMovie as saveMovieToFirestore,
  getMovie,
  getAllMovies as getFirestoreMovies,
  updateVote,
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
      if (!body.userAddress) {
        return Response.json(
          { success: false, error: 'User address is required' },
          { status: 400 }
        );
      }
      
      await updateVote(body.id, body.type);
      return Response.json({ success: true });
    } else if (body.action === "getUserVotes") {
      const userVotes = await getUserVotes(body.userAddress);
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