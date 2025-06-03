"use client";

import { MovieCard } from "~/components/MovieCard";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

const SAMPLE_MOVIES = [
  {
    id: "1",
    title: "Inception",
    description: "A thief who steals corporate secrets through dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.",
    releaseYear: "2010",
    director: "Christopher Nolan",
    genres: ["Action", "Sci-Fi", "Thriller"],
    rating: 8.8,
    posterUrl: "https://example.com/inception.jpg",
    voteCountYes: 0,
    voteCountNo: 0
  },
  {
    id: "2",
    title: "The Shawshank Redemption",
    description: "Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency.",
    releaseYear: "1994",
    director: "Frank Darabont",
    genres: ["Drama"],
    rating: 9.3,
    posterUrl: "https://example.com/shawshank.jpg",
    voteCountYes: 0,
    voteCountNo: 0
  },
  {
    id: "3",
    title: "The Dark Knight",
    description: "When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.",
    releaseYear: "2008",
    director: "Christopher Nolan",
    genres: ["Action", "Crime", "Drama"],
    rating: 9.0,
    posterUrl: "https://example.com/dark-knight.jpg",
    voteCountYes: 0,
    voteCountNo: 0
  }
];

export default function DiscoverPage() {
  const [isVoting, setIsVoting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const connected = false;
        setIsConnected(connected);
      } catch (error) {
        console.error('Error checking connection:', error);
        setIsConnected(false);
      }
    };

    checkConnection();
  }, []);

  const handleVote = async (movieId: string, vote: 'yes' | 'no') => {
    setIsVoting(true);
    try {
      console.log(`Voting ${vote} for movie ${movieId}`);
    } catch (error) {
      console.error('Error voting:', error);
    } finally {
      setIsVoting(false);
    }
  };

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
                className="px-4 py-2 rounded-md text-base font-medium border-2 border-transparent transition-colors duration-200 text-white hover:bg-white/10"
              >
                Rewards
              </Link>
            </div>
          </div>
        </div>
      </nav>
      <main className="pt-20 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {SAMPLE_MOVIES.map((movie) => (
              <MovieCard
                key={movie.id}
                movie={movie}
                onVote={(vote) => handleVote(movie.id, vote ? 'yes' : 'no')}
                isVoting={isVoting}
                isConnected={isConnected}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}