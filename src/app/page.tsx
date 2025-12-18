"use client";

import { SwipeableMovies } from "~/components/movies/SwipeableMovies";
import { useState, useEffect } from 'react';
import Header from "~/components/navigation/Header";
import { Card, CardContent } from "~/components/ui/card";

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
    <div className="max-w-2xl mx-auto px-4">
      <Header showSearch={false} />
      <main className="min-h-screen flex flex-col justify-center items-center pb-8 pt-20">
        <div className="w-full flex flex-col items-center">
          <section className="mb-8 w-full text-center">
            <h1 className="text-3xl font-bold text-foreground mb-2">Swipe to Vote on Movies</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Swipe left to vote Yes, swipe right to vote No.
            </p>
          </section>
          <Card className="bg-card border-border rounded-2xl shadow-lg p-6 w-full max-w-md">
            <CardContent className="p-0">
              {loading ? (
                <div className="text-foreground text-center py-16 text-lg font-medium">Loading movies...</div>
              ) : movies.length === 0 ? (
                <div className="text-foreground text-center py-16 text-lg font-medium">
                  <p className="mb-4">No movies found.</p>
                  <p className="text-sm text-muted-foreground">
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
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
