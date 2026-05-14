"use client";

import { SwipeableMovies } from "~/components/movies/SwipeableMovies";
import type { MediaItem } from "~/types";
import { useState, useEffect } from 'react';
import Header from "~/components/navigation/Header";
import { DotmCircular8 } from "~/components/ui/dotm-circular-8";
import Link from "next/link";
import { OnboardingScreen } from "~/components/OnboardingScreen";
import { useOnboarding } from "~/hooks/onboarding";
import { DailySpinModal, useDailySpin } from "~/components/DailySpinModal";

interface Movie {
  id: string;
  _id?: string;
  title: string;
  description: string;
  releaseYear?: string;
  posterUrl?: string;
  votes?: { yes: number; no: number };
  genres?: string[];
  rating?: number;
  contractId?: number;
  createdAt?: string | Date;
  isTVShow?: boolean;
}

// Sample movies for when DB is empty or unreachable
const FALLBACK_MOVIES: Movie[] = [
  {
    id: "fallback-1",
    title: "Dune: Part Two",
    description: "Paul Atreides unites with Chani and the Fremen while on a path of revenge against the conspirators who destroyed his family.",
    releaseYear: "2024",
    posterUrl: "https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg",
    genres: ["Sci-Fi", "Adventure"],
    rating: 8.4,
    votes: { yes: 0, no: 0 },
  },
  {
    id: "fallback-2",
    title: "Oppenheimer",
    description: "The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb.",
    releaseYear: "2023",
    posterUrl: "https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg",
    genres: ["Drama", "History"],
    rating: 8.9,
    votes: { yes: 0, no: 0 },
  },
  {
    id: "fallback-3",
    title: "Poor Things",
    description: "The incredible tale of the fantastical evolution of Bella Baxter, a young woman brought back to life by the brilliant and unorthodox scientist Dr. Godwin Baxter.",
    releaseYear: "2023",
    posterUrl: "https://image.tmdb.org/t/p/w500/kCGlIMHnOm8JPXIf6JFNm0sTAhG.jpg",
    genres: ["Comedy", "Drama"],
    rating: 8.0,
    votes: { yes: 0, no: 0 },
  },
  {
    id: "fallback-4",
    title: "Past Lives",
    description: "Two childhood friends are separated and then reunite over two decades, catching glimpses of what could have been.",
    releaseYear: "2023",
    posterUrl: "https://image.tmdb.org/t/p/w500/k3waqVXSnähe7tq1UaFuKkglApj.jpg",
    genres: ["Drama", "Romance"],
    rating: 7.9,
    votes: { yes: 0, no: 0 },
  },
  {
    id: "fallback-5",
    title: "The Holdovers",
    description: "A curmudgeonly instructor at a New England prep school is forced to remain on campus over the holidays with a troubled student.",
    releaseYear: "2023",
    posterUrl: "https://image.tmdb.org/t/p/w500/VHmNDQMCXnUBhCEHmmoFbz3hKHD.jpg",
    genres: ["Comedy", "Drama"],
    rating: 7.9,
    votes: { yes: 0, no: 0 },
  },
  {
    id: "fallback-6",
    title: "Killers of the Flower Moon",
    description: "Members of the Osage tribe in the United States are murdered under mysterious circumstances in the 1920s, sparking a major FBI investigation.",
    releaseYear: "2023",
    posterUrl: "https://image.tmdb.org/t/p/w500/dB6Krk806zeqd0YNp2ngQ9zXteH.jpg",
    genres: ["Crime", "Drama"],
    rating: 7.7,
    votes: { yes: 0, no: 0 },
  },
];

export default function HomePage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const { hasSeenOnboarding, completeOnboarding } = useOnboarding();
  const { shouldShow: showSpin, dismiss: dismissSpin } = useDailySpin();

  // All hooks must come before any conditional returns
  useEffect(() => {
    // Don't fetch until onboarding state is resolved and user has seen it
    if (hasSeenOnboarding === null || !hasSeenOnboarding) return;

    const fetchMovies = async () => {
      try {
        const res = await fetch("/api/movies");
        const data = await res.json();
        if (data.success && Array.isArray(data.movies) && data.movies.length > 0) {
          const moviesWithPosters = data.movies
            .filter((movie: Movie) => !movie.isTVShow && movie.posterUrl)
            .map((movie: Movie) => ({
              ...movie,
              releaseYear: movie.releaseYear
                ? (typeof movie.releaseYear === 'string'
                  ? movie.releaseYear
                  : new Date(movie.releaseYear).getFullYear().toString())
                : undefined,
            }));
          setMovies(moviesWithPosters.length > 0 ? moviesWithPosters : FALLBACK_MOVIES);
        } else {
          setMovies(FALLBACK_MOVIES);
        }
      } catch (error) {
        console.error('Error fetching movies:', error);
        setMovies(FALLBACK_MOVIES);
      } finally {
        setLoading(false);
      }
    };
    fetchMovies();
  }, [hasSeenOnboarding]);

  // Onboarding state not yet resolved — show spinner
  if (hasSeenOnboarding === null) {
    return (
      <div className="h-[100dvh] bg-black flex items-center justify-center">
        <DotmCircular8 speed={1.35} size={72} animated />
      </div>
    );
  }

  // First-time user — show onboarding
  if (!hasSeenOnboarding) {
    return <OnboardingScreen onComplete={completeOnboarding} />;
  }

  if (loading) {
    return (
      <div className="h-[100dvh] bg-black flex items-center justify-center">
        <DotmCircular8 size={72} animated />
      </div>
    );
  }

  if (movies.length === 0) {
    return (
      <div className="h-[100dvh] bg-black flex flex-col items-center justify-center gap-4 px-6 text-center">
        <span className="text-6xl">🎬</span>
        <h2 className="text-white text-xl font-bold">Nothing to rate yet</h2>
        <p className="text-white/50 text-sm max-w-xs">
          Check back soon — new films are added regularly.
        </p>
        <Link
          href="/discover"
          className="mt-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white"
          style={{ background: 'linear-gradient(145deg, #e8e8e8 0%, #c0c0c0 30%, #9a9a9a 60%, #d4d4d4 100%)', color: '#111' }}
        >
          Discover movies
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="h-[100dvh] bg-black flex flex-col overflow-hidden">
        <Header showSearch={false} />
        <main className="flex-1 flex flex-col pt-16 min-h-0">
          <SwipeableMovies
            movies={movies}
            allMedia={movies as unknown as MediaItem[]}
            onMoviesExhausted={() => setMovies([])}
          />
        </main>
      </div>
      <DailySpinModal open={showSpin} onClose={dismissSpin} />
    </>
  );
}
