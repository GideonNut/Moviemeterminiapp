"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { SwipeableMovieCard } from './SwipeableMovieCard';

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
}

interface SwipeableMoviesProps {
  movies: Movie[];
  onMoviesExhausted?: () => void;
}

export function SwipeableMovies({ movies, onMoviesExhausted }: SwipeableMoviesProps) {
  const { data: session } = useSession();
  const [currentMovies, setCurrentMovies] = useState<Movie[]>([]);
  const [votedMovies, setVotedMovies] = useState<Set<string>>(new Set());
  const [isVoting, setIsVoting] = useState(false);

  // Initialize with movies that haven't been voted on
  useEffect(() => {
    const unvotedMovies = movies.filter(movie => {
      const movieId = movie.id || movie._id || '';
      return !votedMovies.has(movieId);
    });
    setCurrentMovies(unvotedMovies);
  }, [movies, votedMovies]);

  const handleSwipe = async (direction: 'left' | 'right') => {
    if (currentMovies.length === 0 || isVoting) return;

    const currentMovie = currentMovies[0];
    const movieId = currentMovie.id || currentMovie._id || '';
    const vote = direction === 'right' ? 'yes' : 'no';

    if (!session?.user?.fid) {
      alert('Please sign in with Farcaster to vote');
      return;
    }

    setIsVoting(true);

    try {
      // Save vote to Firebase
      const response = await fetch("/api/movies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify({
          action: "vote",
          id: movieId,
          type: vote
        })
      });

      const result = await response.json();

      if (response.ok) {
        // Mark this movie as voted
        setVotedMovies(prev => new Set(prev).add(movieId));
        
        // Remove the current movie from the stack (it's already been voted on)
        setCurrentMovies(prev => prev.slice(1));

        console.log(`Successfully voted ${vote} for movie ${movieId} - saved to Firebase`);
      } else {
        throw new Error(result.error || 'Failed to submit vote');
      }
    } catch (error) {
      console.error('Error voting:', error);
      alert(error instanceof Error ? error.message : 'An error occurred while voting');
    } finally {
      setIsVoting(false);
    }
  };

  const handleVoteComplete = () => {
    // Check if we've run out of movies
    if (currentMovies.length <= 1 && onMoviesExhausted) {
      setTimeout(() => {
        onMoviesExhausted();
      }, 500);
    }
  };

  if (currentMovies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[600px] text-white">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">All caught up!</h2>
          <p className="text-white/70 mb-6">You've voted on all available movies.</p>
          <button
            onClick={() => {
              setVotedMovies(new Set());
              setCurrentMovies(movies);
            }}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
          >
            Reset & Vote Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-sm mx-auto h-[800px]">
      {currentMovies.slice(0, 3).map((movie, index) => (
        <SwipeableMovieCard
          key={movie.id || movie._id || index}
          movie={movie}
          onSwipe={handleSwipe}
          onVoteComplete={handleVoteComplete}
          index={index}
          total={Math.min(currentMovies.length, 3)}
        />
      ))}
      
      {currentMovies.length > 0 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white/60 text-sm">
          {currentMovies.length} {currentMovies.length === 1 ? 'movie' : 'movies'} remaining
        </div>
      )}
    </div>
  );
}

