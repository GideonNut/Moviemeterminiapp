"use client";
import { Card, CardContent, CardTitle, CardDescription } from "~/components/ui/card";
import { Button } from "~/components/ui/Button";
import { useRouter } from "next/navigation";
import { ArrowLeft, Gift, Coins, Trophy, Star } from "lucide-react";
import Header from "~/components/Header";

export default function RewardsPage() {
  const router = useRouter();

  // Mock rewards data
  const availableRewards = [
    {
      id: 1,
      title: "Movie Critic Badge",
      description: "Vote on 10 movies to earn this badge",
      points: 100,
      progress: 7,
      total: 10,
      type: "badge",
      claimable: false
    },
    {
      id: 2,
      title: "Early Bird Tokens",
      description: "50 tokens for being an early adopter",
      points: 50,
      type: "tokens",
      claimable: true
    },
    {
      id: 3,
      title: "Community Champion",
      description: "Vote on 25 movies to unlock",
      points: 250,
      progress: 7,
      total: 25,
      type: "badge",
      claimable: false
    }
  ];

  const getIcon = (type: string) => {
    switch (type) {
      case 'badge':
        return <Trophy size={20} className="text-yellow-400" />;
      case 'tokens':
        return <Coins size={20} className="text-green-400" />;
      default:
        return <Gift size={20} className="text-purple-400" />;
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
          className="mr-3 p-2 bg-white hover:bg-white/10"
        >
          <ArrowLeft size={18} />
        </Button>
        <h1 className="text-xl font-semibold text-white">Rewards</h1>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <Card className="bg-[#18181B] border-white/10">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-white mb-1">150</div>
            <div className="text-xs text-white/60">Total Points</div>
          </CardContent>
        </Card>
        <Card className="bg-[#18181B] border-white/10">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-400 mb-1">50</div>
            <div className="text-xs text-white/60">Claimable</div>
          </CardContent>
        </Card>
        <Card className="bg-[#18181B] border-white/10">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-400 mb-1">2</div>
            <div className="text-xs text-white/60">Badges</div>
          </CardContent>
        </Card>
      </div>

      {/* Available Rewards */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-white mb-3">Available Rewards</h2>
        
        {availableRewards.map((reward) => (
          <Card key={reward.id} className="bg-[#18181B] text-white border border-white/10">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {getIcon(reward.type)}
                    <CardTitle className="text-base font-medium">
                      {reward.title}
                    </CardTitle>
                  </div>
                  
                  <CardDescription className="text-sm text-white/60 mb-3">
                    {reward.description}
                  </CardDescription>

                  {/* Progress bar for non-claimable items */}
                  {reward.progress !== undefined && reward.total && (
                    <div className="mb-3">
                      <div className="flex justify-between text-xs text-white/60 mb-1">
                        <span>Progress</span>
                        <span>{reward.progress}/{reward.total}</span>
                      </div>
                      <div className="w-full bg-white/20 rounded-full h-2">
                        <div 
                          className="bg-purple-400 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(reward.progress / reward.total) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-white">
                      {reward.points} {reward.type === 'tokens' ? 'tokens' : 'points'}
                    </span>
                    
                    <Button
                      size="sm"
                      variant={reward.claimable ? 'default' : 'ghost'}
                      disabled={!reward.claimable}
                      className="text-xs bg-white text-gray-800 px-3 py-1"
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
        <Card className="bg-[#18181B] text-white border border-white/10">
          <CardContent className="p-8 text-center">
            <Gift size={48} className="text-white/40 mx-auto mb-4" />
            <CardTitle className="text-base font-medium mb-2">
              No rewards available
            </CardTitle>
            <CardDescription className="text-sm text-white/60">
              Start voting on movies to earn your first rewards!
            </CardDescription>
          </CardContent>
        </Card>
      )}
    </div>
  );
}