"use client";
import { Navigation } from "~/components/Navigation";
import { Button } from "~/components/ui/Button";

const REWARDS = [
  {
    id: "1",
    title: "Movie Critic",
    description: "Vote on 10 movies to earn this badge",
    progress: 4,
    total: 10,
    reward: "500 points"
  },
  {
    id: "2",
    title: "Genre Expert",
    description: "Vote on 5 movies in each genre",
    progress: 2,
    total: 5,
    reward: "1000 points"
  },
  {
    id: "3",
    title: "Early Adopter",
    description: "Be among the first 100 users to vote",
    progress: 1,
    total: 1,
    reward: "2000 points"
  }
];

export default function RewardsPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Your Rewards</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Self Protocol Verification Card */}
          <div className="bg-[#1A1A1A] rounded-xl border border-white/10 p-6 hover:border-white/20 transition-colors duration-200">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-white">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold">Self Protocol Verification</h3>
                <p className="text-white/60 text-sm">Get extra rewards by verifying your identity</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/60">Bonus Rewards</span>
                <span className="font-medium">+50%</span>
              </div>
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => window.open('https://self.id', '_blank')}
              >
                Verify Now
              </Button>
            </div>
          </div>

          {/* Your existing reward cards */}
          {REWARDS.map((reward) => (
            <div
              key={reward.id}
              className="bg-[#1A1A1A] rounded-2xl p-6 border border-white/10"
            >
              <h3 className="text-xl font-semibold text-white mb-2">
                {reward.title}
              </h3>
              <p className="text-white/60 mb-4">{reward.description}</p>
              <div className="w-full bg-white/10 rounded-full h-2 mb-2">
                <div
                  className="bg-white h-2 rounded-full"
                  style={{
                    width: `${(reward.progress / reward.total) * 100}%`,
                  }}
                />
              </div>
              <div className="flex justify-between text-sm text-white/60">
                <span>
                  {reward.progress}/{reward.total}
                </span>
                <span>{reward.reward}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 