"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Trophy, Users, Flame, ArrowLeft, RefreshCw, Loader2, Award } from "lucide-react";
import { useAccount } from "wagmi";
import Header from "~/components/Header";

interface TopVoter {
  rank: number;
  address: string;
  votes: number;
  streak: number;
  yesVotes: number;
  noVotes: number;
  lastVoteDate: string;
}

interface StreakEntry {
  rank: number;
  address: string;
  streak: number;
  totalVotes: number;
  lastVoteDate: string;
}

interface EarnerEntry {
  rank: number;
  address: string;
  earnings: number;
  activity: string;
  totalVotes: number;
  streak: number;
}

interface LeaderboardData {
  topVoters: TopVoter[];
  longestStreaks: StreakEntry[];
  topEarners: EarnerEntry[];
  totalUsers: number;
  totalVotes: number;
}

const leaderboardTypes = [
  { id: "voters", name: "Top Voters", icon: Users, metric: "votes" },
  { id: "earners", name: "Top Earners", icon: Trophy, metric: "earnings" },
  { id: "streaks", name: "Longest Streaks", icon: Flame, metric: "streak" },
];

function formatAddress(address: string): string {
  return `${address?.slice(0, 6)}...${address?.slice(-4)}`;
}

function formatDate(dateString: string): string {
  if (!dateString) return 'Never';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 1) return 'Today';
  if (diffDays === 2) return 'Yesterday';
  if (diffDays <= 7) return `${diffDays - 1} days ago`;
  return date.toLocaleDateString();
}

function getRankIcon(rank: number) {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return `#${rank}`;
}

function getRankColor(rank: number) {
  if (rank === 1) return "text-yellow-400";
  if (rank === 2) return "text-gray-300";
  if (rank === 3) return "text-amber-600";
  return "text-white/80";
}

export default function LeaderboardsPage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'voters' | 'earners' | 'streaks'>('voters');
  const [userRank, setUserRank] = useState<{ voters?: number; earners?: number; streaks?: number }>({});

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  };

  const fetchLeaderboards = async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      
      const response = await fetch('/api/leaderboards');
      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard data');
      }
      
      const leaderboardData = await response.json();
      setData(leaderboardData);
      
      // Find user's rank if connected
      if (isConnected && address) {
        const votersRank = leaderboardData.topVoters?.find((entry: TopVoter) => entry.address === address)?.rank;
        const earnersRank = leaderboardData.topEarners?.find((entry: EarnerEntry) => entry.address === address)?.rank;
        const streaksRank = leaderboardData.longestStreaks?.find((entry: StreakEntry) => entry.address === address)?.rank;

        setUserRank({
          voters: votersRank,
          earners: earnersRank,
          streaks: streaksRank
        });
      }
    } catch (err) {
      console.error('Error fetching leaderboards:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLeaderboards();
  }, []);

  useEffect(() => {
    // Update user rank when address changes
    if (data && isConnected && address) {
      const votersRank = data.topVoters?.find(entry => entry.address === address)?.rank;
      const earnersRank = data.topEarners?.find(entry => entry.address === address)?.rank;
      const streaksRank = data.longestStreaks?.find(entry => entry.address === address)?.rank;
      
      setUserRank({
        voters: votersRank,
        earners: earnersRank,
        streaks: streaksRank
      });
    } else {
      setUserRank({});
    }
  }, [data, address, isConnected]);

  const getCurrentData = () => {
    if (!data) return [];
    switch (activeTab) {
      case 'voters':
        return data.topVoters;
      case 'earners':
        return data.topEarners;
      case 'streaks':
        return data.longestStreaks;
      default:
        return data.topVoters;
    }
  };

  const getCurrentUserRank = () => {
    switch (activeTab) {
      case 'voters':
        return userRank.voters;
      case 'earners':
        return userRank.earners;
      case 'streaks':
        return userRank.streaks;
      default:
        return userRank.voters;
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0A0A0A] text-white">
        <div className="max-w-2xl mx-auto px-4 pb-20">
          <Header showSearch={true} />
          <div className="flex items-center mt-10 mb-6">
            <button 
              onClick={handleBack}
              className="mr-3 p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <ArrowLeft size={18} />
            </button>
            <h1 className="text-xl font-semibold text-white">Leaderboards</h1>
          </div>

          <div className="flex justify-center items-center py-20">
            <div className="flex items-center space-x-2">
              <Loader2 className="animate-spin" size={24} />
              <span className="text-white/60">Loading leaderboard data...</span>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-[#0A0A0A] text-white">
        <div className="max-w-2xl mx-auto px-4 pb-20">
          <Header showSearch={true} />
          <div className="flex items-center mt-10 mb-6">
            <button 
              onClick={handleBack}
              className="mr-3 p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <ArrowLeft size={18} />
            </button>
            <h1 className="text-xl font-semibold text-white">Leaderboards</h1>
          </div>

          <div className="flex justify-center items-center py-20">
            <div className="text-center">
              <Trophy size={48} className="text-white/40 mx-auto mb-4" />
              <p className="text-red-400 mb-4">{error}</p>
              <button 
                onClick={() => fetchLeaderboards()}
                className="bg-[#18181B] hover:bg-[#27272A] text-white px-4 py-2 rounded-lg border border-white/10 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const currentLeaderboard = leaderboardTypes?.find(lt => lt.id === activeTab);
  const currentData = getCurrentData();

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white">
      <div className="max-w-2xl mx-auto px-4 pb-20">
        <Header showSearch={true} />
        
        {/* Page Header */}
        <div className="flex items-center mt-10 mb-6">
          <button 
            onClick={handleBack}
            className="mr-3 p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-xl font-semibold text-white">Leaderboards</h1>
        </div>

        {/* Hero Section */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Trophy className="mr-3 text-yellow-400" size={32} />
            <h2 className="text-2xl font-bold">Top Performers</h2>
          </div>
          <p className="text-white/60 text-sm max-w-lg mx-auto mb-4">
            Discover the top performers in the MovieMeter community
          </p>
          {data && (
            <div className="flex justify-center gap-6 text-sm">
              <span className="text-purple-400 font-medium">
                {data.totalUsers.toLocaleString()} users
              </span>
              <span className="text-blue-400 font-medium">
                {data.totalVotes.toLocaleString()} votes
              </span>
            </div>
          )}
        </div>

        {/* User's Rank (if connected) */}
        {isConnected && (
          <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                {formatAddress(address!)[0].toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="text-white font-medium text-sm">Your Ranking</div>
                <div className="text-white/60 text-xs">{formatAddress(address!)}</div>
              </div>
              <div className="text-right">
                {getCurrentUserRank() ? (
                  <div>
                    <div className="text-purple-400 font-bold">#{getCurrentUserRank()}</div>
                    <div className="text-white/40 text-xs">
                      {activeTab === 'voters' ? 'Votes' : 
                       activeTab === 'earners' ? 'Earnings' : 'Streak'}
                    </div>
                  </div>
                ) : (
                  <div className="text-white/40 text-xs">Not ranked</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6">
          {leaderboardTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => setActiveTab(type.id as 'voters' | 'earners' | 'streaks')}
              className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors flex-1 justify-center text-sm ${
                activeTab === type.id
                  ? "bg-white text-[#0A0A0A]"
                  : "bg-[#18181B] text-white/60 hover:bg-[#27272A] hover:text-white border border-white/10"
              }`}
            >
              <type.icon className="mr-2" size={16} />
              {type.name}
            </button>
          ))}
        </div>

        {/* Leaderboard Content */}
        {currentLeaderboard && (
          <div className="bg-[#18181B] rounded-lg border border-white/10 overflow-hidden">
            <div className="bg-[#27272A] px-4 py-3 border-b border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <currentLeaderboard.icon className="mr-2 text-white/80" size={18} />
                  <h3 className="font-semibold text-white">{currentLeaderboard.name}</h3>
                </div>
                <button 
                  onClick={() => fetchLeaderboards(true)}
                  disabled={refreshing}
                  className="text-white/60 hover:text-white transition-colors p-1"
                >
                  <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
                </button>
              </div>
              <p className="text-white/40 text-xs mt-1">
                Updated in real-time • Based on actual voting data
              </p>
            </div>

            <div className="divide-y divide-white/5">
              {currentData?.length > 0 ? (
                currentData.map((entry: any, index: number) => (
                  <div 
                    key={`${entry.address}-${index}`}
                    className={`p-4 hover:bg-white/5 transition-colors ${
                      entry.address === address ? 'bg-purple-500/10 border-l-4 border-purple-500' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Rank */}
                      <div className="w-12 flex items-center justify-center">
                        <div className={`text-lg font-bold ${getRankColor(entry.rank)}`}>
                          {getRankIcon(entry.rank)}
                        </div>
                      </div>

                      {/* User Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-white text-xs font-medium">
                            {formatAddress(entry.address)[0].toUpperCase()}
                          </div>
                          <span className="text-white font-medium text-sm truncate">
                            {formatAddress(entry.address)}
                          </span>
                          {entry.address === address && (
                            <span className="text-purple-400 text-xs bg-purple-400/20 px-2 py-0.5 rounded flex-shrink-0">
                              You
                            </span>
                          )}
                        </div>
                        
                        {/* Stats based on active tab */}
                        {activeTab === 'voters' && (
                          <div className="flex items-center gap-4 text-xs text-white/60">
                            <span className="text-green-400">{entry.yesVotes} Yes</span>
                            <span className="text-red-400">{entry.noVotes} No</span>
                           
                          </div>
                        )}
                        
                        {activeTab === 'streaks' && (
                          <div className="text-xs text-white/60 truncate">
                            {entry.totalVotes} total votes • Last: {formatDate(entry.lastVoteDate)}
                          </div>
                        )}
                        
                        {activeTab === 'earners' && (
                          <div className="text-xs text-white/60 truncate">
                            {entry.activity}
                          </div>
                        )}
                      </div>

                      {/* Primary Stat */}
                      <div className="text-right">
                        <div className={`text-lg font-bold ${
                          entry.rank <= 3 ? 'text-yellow-400' : 'text-white'
                        }`}>
                          {activeTab === 'voters' ? entry.votes.toLocaleString() :
                           activeTab === 'earners' ? `${entry.earnings} G$` :
                           `${entry.streak}d`}
                        </div>
                        <div className="text-xs text-white/40">
                          {currentLeaderboard.metric}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center">
                  <Trophy size={48} className="text-white/40 mx-auto mb-4" />
                  <p className="text-white/60 mb-2">No data available yet</p>
                  <p className="text-xs text-white/40">Start voting on movies to appear on the leaderboard!</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Refresh Button */}
        <div className="mt-6 text-center">
          <button 
            onClick={() => fetchLeaderboards(true)}
            disabled={refreshing}
            className="bg-[#18181B] hover:bg-[#27272A] text-white px-6 py-2 rounded-lg border border-white/10 transition-colors disabled:opacity-50"
          >
            {refreshing ? (
              <>
                <RefreshCw size={16} className="animate-spin mr-2 inline" />
                Refreshing...
              </>
            ) : (
              <>
                <RefreshCw size={16} className="mr-2 inline" />
                Refresh Data
              </>
            )}
          </button>
        </div>
      </div>
    </main>
  );
}