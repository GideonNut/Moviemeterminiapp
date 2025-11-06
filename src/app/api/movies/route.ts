import { NextRequest } from "next/server";
import { 
  saveMovie as saveMovieToFirestore,
  getMovie,
  getAllMovies as getFirestoreMovies,
  updateVote
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
    
    let movies;
    if (searchTerm) {
      // Implement search if needed
      movies = await getFirestoreMovies();
      movies = movies.filter(movie => 
        movie.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    } else {
      movies = await getFirestoreMovies();
    }

    // Sort by most recent first
    const sortedMovies = movies.sort((a, b) => 
      new Date(b.createdAt?.toDate()).getTime() - new Date(a.createdAt?.toDate()).getTime()
    );

    return Response.json({ 
      success: true, 
      movies: sortedMovies.map(movie => ({
        ...movie,
        id: movie.id,
        _id: movie.id, // For backward compatibility
        commentCount: movie.commentCount || 0,
        createdAt: movie.createdAt?.toDate().toISOString(),
        updatedAt: movie.updatedAt?.toDate().toISOString()
      }))
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