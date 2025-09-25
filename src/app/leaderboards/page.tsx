"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Users, Flame, ArrowLeft, RefreshCw, Loader2, Award } from "lucide-react";
import { TrophyIcon } from '~/components/icons';
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
  { id: "earners", name: "Top Earners", icon: TrophyIcon, metric: "earnings" },
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
      <main className="min-h-screen">
        <div className="max-w-2xl mx-auto px-4 pb-20">
          <Header showSearch={false} />
          <div className="flex items-center mt-10 mb-6">
            <button 
              onClick={handleBack}
              className="mr-3 p-2 rounded-md outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
            >
              <ArrowLeft size={18} />
            </button>
            <h1 className="text-xl font-semibold text-foreground">Leaderboards</h1>
          </div>

          <div className="flex justify-center items-center py-20">
            <div className="flex items-center space-x-2">
              <Loader2 className="animate-spin" size={24} />
              <span className="text-muted-foreground">Loading leaderboard data...</span>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen">
        <div className="max-w-2xl mx-auto px-4 pb-20">
          <Header showSearch={false} />
          <div className="flex items-center mt-10 mb-6">
            <button 
              onClick={handleBack}
              className="mr-3 p-2 rounded-md outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
            >
              <ArrowLeft size={18} />
            </button>
            <h1 className="text-xl font-semibold text-foreground">Leaderboards</h1>
          </div>

          <div className="flex justify-center items-center py-20">
            <div className="text-center">
              <TrophyIcon size={48} className="text-muted-foreground mx-auto mb-4" />
              <p className="text-foreground mb-4">{error}</p>
              <button 
                onClick={() => fetchLeaderboards()}
                className="px-4 py-2 rounded-md border bg-background hover:bg-accent hover:text-accent-foreground border-border transition-colors outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
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
    <main className="min-h-screen">
      <div className="max-w-2xl mx-auto px-4 pb-20">
        <Header showSearch={false} />
        
        {/* Page Header */}
        <div className="flex items-center mt-10 mb-6">
          <button 
            onClick={handleBack}
            className="mr-3 p-2 rounded-md outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-xl font-semibold text-foreground">Leaderboards</h1>
        </div>

        {/* Hero Section */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <TrophyIcon className="mr-3 text-accent-foreground" size={32} />
            <h2 className="text-2xl font-bold text-foreground">Top Performers</h2>
          </div>
          <p className="text-muted-foreground text-sm max-w-lg mx-auto mb-4">
            Discover the top performers in the MovieMeter community
          </p>
          {data && (
            <div className="flex justify-center gap-6 text-sm">
              <span className="text-foreground font-medium">
                {data.totalUsers.toLocaleString()} users
              </span>
              <span className="text-foreground font-medium">
                {data.totalVotes.toLocaleString()} votes
              </span>
            </div>
          )}
        </div>

        {/* User's Rank (if connected) */}
        {isConnected && (
          <div className="bg-accent/20 border border-border rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold">
                {formatAddress(address!)[0].toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="text-foreground font-medium text-sm text-left">Your Ranking</div>
                <div className="text-muted-foreground text-xs text-left">{formatAddress(address!)}</div>
              </div>
              <div className="text-right">
                {getCurrentUserRank() ? (
                  <div>
                    <div className="text-foreground font-bold">#{getCurrentUserRank()}</div>
                    <div className="text-muted-foreground text-xs">
                      {activeTab === 'voters' ? 'Votes' : 
                       activeTab === 'earners' ? 'Earnings' : 'Streak'}
                    </div>
                  </div>
                ) : (
                  <div className="text-muted-foreground text-xs">Not ranked</div>
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
              className={`flex items-center px-4 py-2 rounded-md font-medium transition-colors flex-1 justify-center text-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] ${
                activeTab === type.id
                  ? "bg-primary text-primary-foreground"
                  : "border bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              <type.icon className="mr-2" size={16} />
              {type.name}
            </button>
          ))}
        </div>

        {/* Leaderboard Content */}
        {currentLeaderboard && (
          <div className="bg-card rounded-lg border border-border overflow-hidden" data-slot="leaderboard">
            <div className="bg-popover px-4 py-3 border-b border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <currentLeaderboard.icon className="mr-2 text-foreground" size={18} />
                  <h3 className="font-semibold text-foreground">{currentLeaderboard.name}</h3>
                </div>
                <button 
                  onClick={() => fetchLeaderboards(true)}
                  disabled={refreshing}
                  className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                >
                  <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
                </button>
              </div>
              <p className="text-muted-foreground text-xs mt-1 text-left">
                Updated in real-time • Based on actual voting data
              </p>
            </div>

            <div className="divide-y divide-border/50">
              {currentData?.length > 0 ? (
                currentData.map((entry: any, index: number) => (
                  <div 
                    key={`${entry.address}-${index}`}
                    className={`p-4 hover:bg-accent/30 transition-colors text-left ${
                      entry.address === address ? 'bg-accent/30 border-l-4 border-accent' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Rank */}
                      <div className="w-12 flex items-center justify-center">
                        <div className={`text-lg font-bold text-foreground`}>
                          {getRankIcon(entry.rank)}
                        </div>
                      </div>

                      {/* User Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-xs font-medium">
                            {formatAddress(entry.address)[0].toUpperCase()}
                          </div>
                          <span className="text-foreground font-medium text-sm truncate">
                            {formatAddress(entry.address)}
                          </span>
                          {entry.address === address && (
                            <span className="text-accent-foreground text-xs bg-accent/40 px-2 py-0.5 rounded flex-shrink-0">
                              You
                            </span>
                          )}
                        </div>
                        
                        {/* Stats based on active tab */}
                        {activeTab === 'voters' && (
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>{entry.yesVotes} Yes</span>
                            <span>{entry.noVotes} No</span>
                           
                          </div>
                        )}
                        
                        {activeTab === 'streaks' && (
                          <div className="text-xs text-muted-foreground truncate">
                            {entry.totalVotes} total votes • Last: {formatDate(entry.lastVoteDate)}
                          </div>
                        )}
                        
                        {activeTab === 'earners' && (
                          <div className="text-xs text-muted-foreground truncate">
                            {entry.activity}
                          </div>
                        )}
                      </div>

                      {/* Primary Stat */}
                      <div className="text-right">
                        <div className={`text-lg font-bold text-foreground`}>
                          {activeTab === 'voters' ? entry.votes.toLocaleString() :
                           activeTab === 'earners' ? `${entry.earnings} G$` :
                           `${entry.streak}d`}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {currentLeaderboard.metric}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center">
                  <TrophyIcon size={48} className="text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-2">No data available yet</p>
                  <p className="text-xs text-muted-foreground">Start voting on movies to appear on the leaderboard!</p>
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
            className="px-6 py-2 rounded-md border bg-background hover:bg-accent hover:text-accent-foreground border-border transition-colors disabled:opacity-50 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
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