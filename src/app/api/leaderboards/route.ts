import { NextRequest, NextResponse } from "next/server";
import { getVotesCollection } from "~/lib/mongo";

interface LeaderboardEntry {
  address: string;
  totalVotes: number;
  yesVotes: number;
  noVotes: number;
  lastVoteDate: string;
  streak: number;
}

export async function GET(req: NextRequest) {
  try {
    const VoteModel = await getVotesCollection();
    
    // Get all votes from MongoDB
    const allVotes = await VoteModel.find({}).sort({ createdAt: -1 });
    
    // Group votes by address
    const userStats: Record<string, LeaderboardEntry> = {};
    
    allVotes.forEach((vote: any) => {
      const address = vote.userAddress;
      if (!userStats[address]) {
        userStats[address] = {
          address,
          totalVotes: 0,
          yesVotes: 0,
          noVotes: 0,
          lastVoteDate: '',
          streak: 0
        };
      }
      
      userStats[address].totalVotes++;
      if (vote.type === 'yes') {
        userStats[address].yesVotes++;
      } else {
        userStats[address].noVotes++;
      }
      
      const voteDate = new Date(vote.createdAt).toISOString().split('T')[0];
      if (!userStats[address].lastVoteDate || voteDate > userStats[address].lastVoteDate) {
        userStats[address].lastVoteDate = voteDate;
      }
    });
    
    // Calculate streaks (simplified - consecutive days of voting)
    const today = new Date().toISOString().split('T')[0];
    Object.values(userStats).forEach(user => {
      const lastVote = new Date(user.lastVoteDate);
      const daysSinceLastVote = Math.floor((new Date(today).getTime() - lastVote.getTime()) / (1000 * 60 * 60 * 24));
      
      // Simple streak calculation - if they voted today or yesterday, give them a streak
      // In a real app, you'd calculate actual consecutive days
      user.streak = daysSinceLastVote <= 1 ? Math.min(user.totalVotes, 30) : 0;
    });
    
    // Convert to arrays and sort
    const topVoters = Object.values(userStats)
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
      totalVotes: allVotes.length
    });
    
  } catch (error) {
    console.error("Error fetching leaderboard data:", error);
    return NextResponse.json({ error: "Failed to fetch leaderboard data" }, { status: 500 });
  }
}