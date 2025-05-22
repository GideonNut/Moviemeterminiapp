"use client";

import { Navigation } from "~/components/Navigation";

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
    <div className="min-h-screen bg-[#0A0A0A]">
      <Navigation />
      <main className="pt-20 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-white mb-8">Your Rewards</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
      </main>
    </div>
  );
} 