import { NextRequest } from "next/server";
import { getAllMovies, saveMovie, saveVote, resetMovieIds, getUserVotes, addVotePoints } from "../../../lib/mongo";
import { Comment } from "~/lib/mongo";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const movies = await getAllMovies();
    
    // Get comment counts for all movies
    const commentCounts = await Comment.aggregate([
      {
        $group: {
          _id: "$movieId",
          commentCount: { $sum: 1 }
        }
      }
    ]);

    // Create a map of movie ID to comment count
    const commentCountMap = new Map(
      commentCounts.map(item => [item._id.toString(), item.commentCount])
    );

    // Add comment counts to movies
    const moviesWithComments = movies.map(movie => {
      const movieObj = movie.toObject();
      return {
        ...movieObj,
        commentCount: commentCountMap.get(movieObj._id.toString()) || 0
      };
    });

    return Response.json({ success: true, movies: moviesWithComments });
  } catch (error) {
    return Response.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (body.action === "add") {
      const result = await saveMovie(body.movie);
      return Response.json({ success: true, movieId: result.id });
    } else if (body.action === "vote") {
      await saveVote(body.id, body.type, body.userAddress);
      // Award 1 point for voting
      await addVotePoints(body.userAddress);
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