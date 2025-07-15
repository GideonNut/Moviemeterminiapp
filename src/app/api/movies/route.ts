import { NextRequest } from "next/server";
import { getMoviesCollection, getVotesCollection } from "../../../lib/mongo";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const moviesCollection = await getMoviesCollection();
    const votesCollection = await getVotesCollection();
    const movies = await moviesCollection.find({}).toArray();
    // Aggregate votes for each movie
    const movieIds = movies.map(m => m._id?.toString() || m.id);
    const votes = await votesCollection.aggregate([
      { $match: { movieId: { $in: movieIds } } },
      { $group: {
        _id: "$movieId",
        yes: { $sum: { $cond: ["$vote", 1, 0] } },
        no: { $sum: { $cond: ["$vote", 0, 1] } }
      }}
    ]).toArray();
    const voteMap = Object.fromEntries(votes.map(v => [v._id, v]));
    const moviesWithVotes = movies.map(m => {
      const id = m._id?.toString() || m.id;
      const v = voteMap[id] || { yes: 0, no: 0 };
      return { ...m, voteCountYes: v.yes, voteCountNo: v.no };
    });
    return Response.json({ success: true, movies: moviesWithVotes });
  } catch (error) {
    return Response.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
} 