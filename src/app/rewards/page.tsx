"use client";

import Link from 'next/link';
import Image from 'next/image';

export default function RewardsPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0A0A0A] border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link href="/" className="text-white text-xl font-bold flex items-center">
                <div className="w-48 h-12 relative">
                  <Image
                    src="https://i.postimg.cc/Gtz6FMmk/new-favicon.png"
                    alt="MovieMetter Logo"
                    layout="fill"
                    objectFit="contain"
                  />
                </div>
              </Link>
              <Link
                href="/rewards"
                className="px-4 py-2 rounded-md text-base font-medium border-2 border-transparent transition-colors duration-200 bg-white text-black"
              >
                Rewards
              </Link>
            </div>
          </div>
        </div>
      </nav>
      <main className="pt-20 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-white mb-8">Rewards</h1>
          <div className="bg-white/5 rounded-lg p-6">
            <p className="text-white">Coming soon...</p>
          </div>
        </div>
      </main>
    </div>
  );
} 