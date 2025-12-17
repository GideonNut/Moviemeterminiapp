"use client";

import { SwipeableMovies } from "~/components/movies/SwipeableMovies";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface Movie {
  id: string;
  _id?: string;
  title: string;
  description: string;
  releaseYear?: string;
  posterUrl?: string;
  votes?: {
    yes: number;
    no: number;
  };
  genres?: string[];
  rating?: number;
  contractId?: number;
  createdAt?: string | Date;
  isTVShow?: boolean;
}

export default function HomePage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const res = await fetch("/api/movies");
        const data = await res.json();
        if (data.success && Array.isArray(data.movies)) {
          // Filter to only show movies (not TV shows) and ensure they have posters
          const moviesWithPosters = data.movies
            .filter((movie: Movie) => !movie.isTVShow && movie.posterUrl)
            .map((movie: Movie) => ({
              ...movie,
              releaseYear: movie.releaseYear 
                ? (typeof movie.releaseYear === 'string' 
                  ? movie.releaseYear 
                  : new Date(movie.releaseYear).getFullYear().toString())
                : undefined
            }));
          setMovies(moviesWithPosters);
        }
      } catch (error) {
        console.error('Error fetching movies:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchMovies();
  }, []);

  const handleMoviesExhausted = () => {
    console.log('All movies have been voted on');
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
                  width={40}
                  height={40}
                  className="object-contain"
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
      <main className="min-h-screen flex flex-col justify-center items-center pb-8 pt-20">
        <div className="w-full max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col items-center">
          <section className="mb-8 w-full text-center">
            <h1 className="text-3xl font-bold text-white mb-2">Swipe to Vote on Movies</h1>
            <p className="text-white/70 max-w-2xl mx-auto">
              Swipe left to vote Yes, swipe right to vote No.
            </p>
          </section>
          <div className="bg-[#18181B] rounded-2xl shadow-lg p-6 w-full max-w-md">
            {loading ? (
              <div className="text-white text-center py-16 text-lg font-medium">Loading movies...</div>
            ) : movies.length === 0 ? (
              <div className="text-white text-center py-16 text-lg font-medium">
                <p className="mb-4">No movies found.</p>
                <p className="text-sm text-white/60">
                  Import movies from TMDB through the admin page to get started.
                </p>
              </div>
            ) : (
              <SwipeableMovies
                movies={movies}
                allMedia={movies as any} // Pass all movies for contractId calculation
                onMoviesExhausted={handleMoviesExhausted}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
