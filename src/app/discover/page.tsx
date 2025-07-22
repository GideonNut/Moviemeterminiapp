"use client";

import { MovieCard } from "~/components/MovieCard";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function DiscoverPage() {
  const [isVoting, setIsVoting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const res = await fetch("/api/movies");
        const data = await res.json();
        if (data.success && Array.isArray(data.movies)) {
          setMovies(data.movies);
        }
      } catch (error) {
        console.error('Error fetching movies:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchMovies();
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
          <div className="flex items-center h-16">
            <Link href="/" className="text-white text-xl font-bold flex items-center mr-6">
              <div className="w-10 h-10 relative">
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
      </nav>
      <main className="min-h-screen flex flex-col justify-center items-center pb-8">
        <div className="w-full max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col items-center">
          <section className="mb-4 w-full">
            <h1 className="text-3xl font-bold text-white text-center mb-1">Discover Movies, Share your taste and be rewarded</h1>
            <p className="text-center text-white/70 max-w-2xl mx-auto">Vote for your favorite movies and see what others love. Your taste matters!</p>
          </section>
          <div className="bg-[#18181B] rounded-2xl shadow-lg p-6">
            {loading ? (
              <div className="text-white text-center py-16 text-lg font-medium">Loading movies...</div>
            ) : movies.length === 0 ? (
              <div className="text-white text-center py-16 text-lg font-medium">No movies found.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {movies.map((movie: any) => (
                  <MovieCard
                    key={movie.id || movie._id}
                    movie={movie}
                    onVote={(vote) => handleVote(movie.id || movie._id, vote ? 'yes' : 'no')}
                    isVoting={isVoting}
                    isConnected={isConnected}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}