import type { QueryDocumentSnapshot } from "firebase-admin/firestore";
import { adminDb } from "~/lib/firebase-admin";

export interface AdminStatsTopItem {
  title: string;
  type: "movie" | "tv";
  yes: number;
  no: number;
  total: number;
}

export interface AdminStats {
  content: {
    movies: number;
    tvShows: number;
    totalContent: number;
  };
  votes: {
    totalYes: number;
    totalNo: number;
    totalVotes: number;
    userVoteRecords: number;
    uniqueVoters: number;
  };
  engagement: {
    comments: number;
    watchlistItems: number;
    usersWithPoints: number;
  };
  topByVotes: AdminStatsTopItem[];
  generatedAt: string;
}

function aggregateContentVotes(
  docs: QueryDocumentSnapshot[],
  type: "movie" | "tv"
) {
  let totalYes = 0;
  let totalNo = 0;
  const topItems: AdminStatsTopItem[] = [];

  for (const doc of docs) {
    const data = doc.data();
    const yes = Number(data.votes?.yes ?? 0);
    const no = Number(data.votes?.no ?? 0);
    totalYes += yes;
    totalNo += no;
    topItems.push({
      title: (data.title as string) || "Untitled",
      type,
      yes,
      no,
      total: yes + no,
    });
  }

  return { totalYes, totalNo, topItems };
}

export async function fetchAdminStats(): Promise<AdminStats> {
  const [
    moviesSnapshot,
    tvShowsSnapshot,
    userVotesSnapshot,
    commentsSnapshot,
    watchlistSnapshot,
    userPointsSnapshot,
  ] = await Promise.all([
    adminDb.collection("movies").get(),
    adminDb.collection("tvShows").get(),
    adminDb.collection("userVotes").get(),
    adminDb.collection("comments").get(),
    adminDb.collection("watchlist").get(),
    adminDb.collection("userPoints").get(),
  ]);

  const moviesAgg = aggregateContentVotes(moviesSnapshot.docs, "movie");
  const tvAgg = aggregateContentVotes(tvShowsSnapshot.docs, "tv");

  const uniqueVoters = new Set<string>();
  for (const doc of userVotesSnapshot.docs) {
    const address = doc.data().userAddress;
    if (typeof address === "string" && address.length > 0) {
      uniqueVoters.add(address.toLowerCase());
    }
  }

  const topByVotes = [...moviesAgg.topItems, ...tvAgg.topItems]
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  const totalYes = moviesAgg.totalYes + tvAgg.totalYes;
  const totalNo = moviesAgg.totalNo + tvAgg.totalNo;

  return {
    content: {
      movies: moviesSnapshot.size,
      tvShows: tvShowsSnapshot.size,
      totalContent: moviesSnapshot.size + tvShowsSnapshot.size,
    },
    votes: {
      totalYes,
      totalNo,
      totalVotes: totalYes + totalNo,
      userVoteRecords: userVotesSnapshot.size,
      uniqueVoters: uniqueVoters.size,
    },
    engagement: {
      comments: commentsSnapshot.size,
      watchlistItems: watchlistSnapshot.size,
      usersWithPoints: userPointsSnapshot.size,
    },
    topByVotes,
    generatedAt: new Date().toISOString(),
  };
}
