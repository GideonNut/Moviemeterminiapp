import { NextRequest, NextResponse } from "next/server";
import { db } from "~/lib/firebase";
import { collection, getDocs, query, orderBy, Timestamp } from "firebase/firestore";

interface LeaderboardEntry {
  address: string;
  totalVotes: number;
  yesVotes: number;
  noVotes: number;
  lastVoteDate: string;
  streak: number;
  engagementScore?: number;
}

export async function GET(req: NextRequest) {
  try {
    // Get all user votes from Firestore
    const votesRef = collection(db, 'userVotes');
    const votesQuery = query(votesRef, orderBy('createdAt', 'desc'));
    const votesSnapshot = await getDocs(votesQuery);
    
    // Group votes by address
    const userStats: Record<string, LeaderboardEntry> = {};
    const userVoteDates: Record<string, Set<string>> = {};
    
    // First pass: collect all votes and group by user
    votesSnapshot.docs.forEach((doc) => {
      const vote = doc.data();
      const address = vote.userAddress;
      const voteDate = vote.createdAt?.toDate ? 
        vote.createdAt.toDate().toISOString().split('T')[0] : 
        new Date().toISOString().split('T')[0];
      
      // Initialize user stats if not exists
      if (!userStats[address]) {
        userStats[address] = {
          address,
          totalVotes: 0,
          yesVotes: 0,
          noVotes: 0,
          lastVoteDate: '',
          streak: 0
        };
        userVoteDates[address] = new Set();
      }
      
      // Update vote counts
      userStats[address].totalVotes++;
      if (vote.voteType === 'yes') {
        userStats[address].yesVotes++;
      } else {
        userStats[address].noVotes++;
      }
      
      // Track vote dates for streak calculation
      userVoteDates[address].add(voteDate);
      
      // Update last vote date if this is the most recent
      if (!userStats[address].lastVoteDate || voteDate > userStats[address].lastVoteDate) {
        userStats[address].lastVoteDate = voteDate;
      }
    });
    
    // Calculate streaks based on consecutive voting days
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    // Calculate streaks for each user
    Object.entries(userStats).forEach(([address, user]) => {
      if (user.lastVoteDate) {
        const lastVote = new Date(user.lastVoteDate);
        const daysSinceLastVote = Math.floor((today.getTime() - lastVote.getTime()) / (1000 * 60 * 60 * 24));
        user.streak = daysSinceLastVote <= 1 ? Math.min(user.totalVotes, 30) : 0;
      } else {
        user.streak = 0;
      }
    });
    
    // Convert to arrays and sort
    const userStatsArray = Object.values(userStats);
    const topVoters = [...userStatsArray]
      .sort((a, b) => b.totalVotes - a.totalVotes)
      .slice(0, 20)
      .map((user, index) => ({
        rank: index + 1,
        address: user.address,
        votes: user.totalVotes,
        streak: user.streak,
        yesVotes: user.yesVotes,
        noVotes: user.noVotes,
        lastVoteDate: user.lastVoteDate
      }));
    
    const longestStreaks = Object.values(userStats)
      .sort((a, b) => b.streak - a.streak)
      .slice(0, 20)
      .map((user, index) => ({
        rank: index + 1,
        address: user.address,
        streak: user.streak,
        totalVotes: user.totalVotes,
        lastVoteDate: user.lastVoteDate
      }));
    
    // Calculate engagement score (combination of votes, streaks, and consistency)
    const topEngagement = Object.values(userStats)
      .map(user => {
        const consistencyBonus = user.totalVotes > 10 ? 1.2 : 1.0;
        const streakBonus = user.streak > 0 ? 1.5 : 1.0;
        const engagementScore = Math.floor(user.totalVotes * consistencyBonus * streakBonus);
        
        return {
          ...user,
          engagementScore
        };
      })
      .sort((a, b) => b.engagementScore - a.engagementScore)
      .slice(0, 20)
      .map((user, index) => ({
        rank: index + 1,
        address: user.address,
        engagementScore: user.engagementScore,
        activity: `${user.totalVotes} votes, ${user.streak} day streak`,
        totalVotes: user.totalVotes,
        streak: user.streak
      }));
    
    return NextResponse.json({
      topVoters,
      longestStreaks,
      topEngagement,
      totalUsers: Object.keys(userStats).length,
      totalVotes: votesSnapshot.size
    });
    
  } catch (error) {
    console.error("Error fetching leaderboard data:", error);
    return NextResponse.json({ error: "Failed to fetch leaderboard data" }, { status: 500 });
  }
}