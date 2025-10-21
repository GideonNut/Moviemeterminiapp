import { NextRequest } from "next/server";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const movieId = searchParams.get('movieId');
    const userAddress = searchParams.get('userAddress');

    if (!movieId) {
      return Response.json({ 
        success: false, 
        error: "Movie ID is required" 
      }, { status: 400 });
    }

    // Check if movie exists in database
    const movieResponse = await fetch(`${request.nextUrl.origin}/api/movies`);
    const movieData = await movieResponse.json();
    const movie = movieData.movies?.find((m: any) => m.id === movieId);

    if (!movie) {
      return Response.json({ 
        success: false, 
        error: `Movie with ID ${movieId} not found in database` 
      }, { status: 404 });
    }

    // Check if movie exists on contract
    const contractResponse = await fetch(`${request.nextUrl.origin}/api/test-contract`);
    const contractData = await contractResponse.json();
    
    let contractMovie = null;
    if (contractData.success && contractData.contractMovies) {
      contractMovie = contractData.contractMovies.find((m: any) => 
        m.id === parseInt(movieId) || m.contractId === movieId
      );
    }

    // Check if user has already voted (if userAddress provided)
    let existingVote = null;
    if (userAddress) {
      try {
        const voteResponse = await fetch(`${request.nextUrl.origin}/api/movies`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'getUserVotes',
            userAddress
          })
        });
        const voteData = await voteResponse.json();
        if (voteData.success) {
          existingVote = voteData.votes?.[movieId];
        }
      } catch (error) {
        console.error('Error checking existing votes:', error);
      }
    }

    // Check contract movie count
    const movieCount = contractData.success ? contractData.movieCount : 'Unknown';

    return Response.json({
      success: true,
      debug: {
        movieId,
        userAddress: userAddress || 'Not provided',
        database: {
          movieExists: !!movie,
          movieTitle: movie?.title || 'N/A',
          movieVotes: movie?.votes || { yes: 0, no: 0 }
        },
        contract: {
          movieExists: !!contractMovie,
          contractMovieCount: movieCount,
          contractMovieData: contractMovie || 'Not found on contract'
        },
        voting: {
          userHasVoted: !!existingVote,
          existingVoteType: existingVote || 'No vote found',
          canVote: !existingVote && !!contractMovie
        },
        recommendations: [
          !movie ? 'Add movie to database first' : null,
          !contractMovie ? 'Add movie to smart contract using admin page' : null,
          existingVote ? 'User has already voted on this movie' : null,
          !userAddress ? 'User address not provided - voting may fail' : null
        ].filter(Boolean)
      }
    });

  } catch (error) {
    return Response.json({
      success: false,
      error: (error as Error).message,
      stack: (error as Error).stack
    }, { status: 500 });
  }
}
