"use client";
import { Card, CardContent, CardTitle, CardDescription } from "~/components/ui/card";
import { Button } from "~/components/ui/Button";
import { useRouter } from "next/navigation";
import { ArrowLeft, Gift, Coins, Star } from "lucide-react";
import {  TrophyIcon } from '~/components/icons'
import Header from "~/components/Header";
import { useAccount } from "wagmi";
import { useState, useEffect } from "react";

interface UserPoints {
  address: string;
  totalPoints: number;
  votePoints: number;
  commentPoints: number;
  lastUpdated: Date;
}

export default function RewardsPage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const [userPoints, setUserPoints] = useState<UserPoints | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch user points
  useEffect(() => {
    if (address) {
      fetchUserPoints();
    } else {
      setLoading(false);
    }
  }, [address]);

  const fetchUserPoints = async () => {
    try {
      const response = await fetch(`/api/points?address=${address}`);
      if (response.ok) {
        const data = await response.json();
        setUserPoints(data.points);
      }
    } catch (error) {
      console.error('Error fetching user points:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate rewards based on user points
  const availableRewards = [
    {
      id: 1,
      title: "Movie Critic Badge",
      description: "Vote on 10 movies to earn this badge",
      points: 100,
      progress: userPoints?.votePoints || 0,
      total: 10,
      type: "badge",
      claimable: (userPoints?.votePoints || 0) >= 10
    },
    {
      id: 2,
      title: "Community Commentator",
      description: "Comment on 5 movies to unlock",
      points: 150,
      progress: Math.floor((userPoints?.commentPoints || 0) / 2),
      total: 5,
      type: "badge",
      claimable: Math.floor((userPoints?.commentPoints || 0) / 2) >= 5
    },
    {
      id: 3,
      title: "Community Champion",
      description: "Vote on 25 movies to unlock",
      points: 250,
      progress: userPoints?.votePoints || 0,
      total: 25,
      type: "badge",
      claimable: (userPoints?.votePoints || 0) >= 25
    }
  ];

  const getIcon = (type: string) => {
    switch (type) {
      case 'badge':
        return <TrophyIcon size={20} className="text-accent-foreground" />;
      case 'tokens':
        return <Coins size={20} className="text-primary" />;
      default:
        return <Gift size={20} className="text-accent-foreground" />;
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4">
      {/* Page Header */}
       <Header showSearch={false} />
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => router.back()} 
          className="mr-3 p-2"
        >
          <ArrowLeft size={18} />
        </Button>
        <h1 className="text-xl font-semibold text-foreground">Rewards</h1>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <Card className="bg-card border-border" data-slot="stats-card">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-foreground mb-1">
              {loading ? "..." : (userPoints?.totalPoints || 0)}
            </div>
            <div className="text-xs text-muted-foreground">Total Points</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border" data-slot="stats-card">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary mb-1">
              {loading ? "..." : (userPoints?.votePoints || 0)}
            </div>
            <div className="text-xs text-muted-foreground">Vote Points</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border" data-slot="stats-card">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-accent-foreground mb-1">
              {loading ? "..." : (userPoints?.commentPoints || 0)}
            </div>
            <div className="text-xs text-muted-foreground">Comment Points</div>
          </CardContent>
        </Card>
      </div>

      {/* Available Rewards */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground mb-3">Available Rewards</h2>
        
        {availableRewards.map((reward) => (
          <Card key={reward.id} className="bg-card border-border" data-slot="reward-card">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {getIcon(reward.type)}
                    <CardTitle className="text-base font-medium text-foreground">
                      {reward.title}
                    </CardTitle>
                  </div>
                  
                  <CardDescription className="text-sm text-muted-foreground mb-3">
                    {reward.description}
                  </CardDescription>

                  {/* Progress bar for non-claimable items */}
                  {reward.progress !== undefined && reward.total && (
                    <div className="mb-3">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>Progress</span>
                        <span>{Math.min(reward.progress, reward.total)}/{reward.total}</span>
                      </div>
                      <div className="w-full bg-muted/20 rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min((reward.progress / reward.total) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">
                      {reward.points} {reward.type === 'tokens' ? 'tokens' : 'points'}
                    </span>
                    
                    <Button
                      size="sm"
                      variant={reward.claimable ? 'default' : 'ghost'}
                      disabled={!reward.claimable}
                      className="text-xs px-3 py-1"
                    >
                      {reward.claimable ? 'Claim' : 'Locked'}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty state if no rewards */}
      {availableRewards.length === 0 && (
        <Card className="bg-card border-border" data-slot="empty-state">
          <CardContent className="p-8 text-center">
            <Gift size={48} className="text-muted-foreground/40 mx-auto mb-4" />
            <CardTitle className="text-base font-medium mb-2 text-foreground">
              No rewards available
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Start voting on movies to earn your first rewards!
            </CardDescription>
          </CardContent>
        </Card>
      )}

      {/* Not connected state */}
      {!isConnected && (
        <Card className="bg-card border-border" data-slot="not-connected">
          <CardContent className="p-8 text-center">
            <Star size={48} className="text-muted-foreground/40 mx-auto mb-4" />
            <CardTitle className="text-base font-medium mb-2 text-foreground">
              Connect Your Wallet
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Connect your wallet to start earning points and unlocking rewards!
            </CardDescription>
          </CardContent>
        </Card>
      )}
    </div>
  );
}