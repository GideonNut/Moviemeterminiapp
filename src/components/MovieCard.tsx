import { Button } from "./ui/Button";
import Image from 'next/image';
import { ensureFullPosterUrl } from "~/lib/utils";

interface Movie {
  id: string;
  title: string;
  description: string;
  releaseYear?: string;
  director?: string;
  cast?: string[];
  genres?: string[];
  rating?: number;
  posterUrl?: string;
  backdropUrl?: string;
  trailerUrl?: string;
  screenshots?: string[];
  votes?: {
    yes: number;
    no: number;
  };
  _id?: string; // Added _id to the interface
}

interface MovieCardProps {
  movie: Movie;
  onVote: (vote: boolean) => void;
  isVoting: boolean;
  isConnected: boolean;
}

// Compact version for carousel display
export function CompactMovieCard({ movie, onVote, isVoting, isConnected }: MovieCardProps) {
  const handleVote = async (vote: boolean) => {
    const movieId = movie.id || movie._id;
    if (!movieId) {
      console.error('No movie ID found:', movie);
      return;
    }
    
    console.log('Voting on movie:', movieId, 'with vote:', vote);
    
    try {
      const response = await fetch("/api/movies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          action: "vote", 
          id: movieId, 
          type: vote ? "yes" : "no",
          userAddress: "demo-user" // Temporary demo user address
        }),
      });
      
      const result = await response.json();
      console.log('Vote response:', result);
      
      if (result.success) {
        onVote(vote);
      } else {
        console.error('Vote failed:', result.error);
      }
    } catch (error) {
      console.error('Error voting:', error);
    }
  };

  // Ensure poster URL is a full URL
  const fullPosterUrl = movie.posterUrl ? ensureFullPosterUrl(movie.posterUrl) : null;

  return (
    <div className="group relative overflow-hidden rounded-xl border border-white/10 bg-[#23232B] shadow-lg transition-all duration-300 hover:border-white/20 flex flex-col w-full max-w-[280px]">
      {/* Movie Poster */}
      <div className="relative aspect-[2/3] w-full overflow-hidden">
        {fullPosterUrl ? (
          <Image
            src={fullPosterUrl}
            alt={movie.title}
            width={280}
            height={420}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-gray-800 flex items-center justify-center">
            <span className="text-gray-400 text-xs">No Poster</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
      </div>

      {/* Movie Info */}
      <div className="flex-1 flex flex-col justify-between p-4">
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-base font-semibold text-white line-clamp-1">{movie.title}</h3>
            <span className="text-xs text-white/60">{movie.releaseYear || 'N/A'}</span>
          </div>
          <p className="mb-3 text-xs text-white/70 line-clamp-2">{movie.description}</p>
          {movie.genres && (
            <div className="mb-3 flex flex-wrap gap-1">
              {movie.genres.slice(0, 2).map((genre) => (
                <span
                  key={genre}
                  className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-white/60"
                >
                  {genre}
                </span>
              ))}
            </div>
          )}
        </div>
        {/* Vote Counts */}
        <div className="mb-3 flex items-center justify-between text-xs mt-2">
          <div className="flex items-center gap-2">
            <span className="text-green-400">Yes: {movie.votes?.yes || 0}</span>
            <span className="text-red-400">No: {movie.votes?.no || 0}</span>
          </div>
          {movie.rating && (
            <div className="flex items-center gap-1">
              <span className="text-yellow-400">★</span>
              <span className="text-white/60">{movie.rating.toFixed(1)}</span>
            </div>
          )}
        </div>
        {/* Vote Buttons */}
        <div className="flex gap-2 mt-2">
          <Button
            variant="default"
            size="sm"
            className="flex-1 text-xs py-1.5"
            onClick={() => handleVote(true)}
            disabled={!isConnected || isVoting}
          >
            Yes
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="flex-1 text-xs py-1.5"
            onClick={() => handleVote(false)}
            disabled={!isConnected || isVoting}
          >
            No
          </Button>
        </div>
      </div>
    </div>
  );
}

export function MovieCard({ movie, onVote, isVoting, isConnected }: MovieCardProps) {
  const handleVote = async (vote: boolean) => {
    const movieId = movie.id || movie._id;
    if (!movieId) {
      console.error('No movie ID found:', movie);
      return;
    }
    
    console.log('Voting on movie:', movieId, 'with vote:', vote);
    
    try {
      const response = await fetch("/api/movies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          action: "vote", 
          id: movieId, 
          type: vote ? "yes" : "no",
          userAddress: "demo-user" // Temporary demo user address
        }),
      });
      
      const result = await response.json();
      console.log('Vote response:', result);
      
      if (result.success) {
        onVote(vote);
      } else {
        console.error('Vote failed:', result.error);
      }
    } catch (error) {
      console.error('Error voting:', error);
    }
  };

  // Ensure poster URL is a full URL
  const fullPosterUrl = movie.posterUrl ? ensureFullPosterUrl(movie.posterUrl) : null;

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[#23232B] shadow-2xl transition-all duration-300 hover:border-white/20 flex flex-col">
      {/* Movie Poster */}
      <div className="relative aspect-[2/3] w-full overflow-hidden">
        {fullPosterUrl ? (
          <Image
            src={fullPosterUrl}
            alt={movie.title}
            width={300}
            height={450}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-gray-800 flex items-center justify-center">
            <span className="text-gray-400 text-sm">No Poster</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
      </div>

      {/* Movie Info */}
      <div className="flex-1 flex flex-col justify-between p-6">
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white line-clamp-1">{movie.title}</h3>
            <span className="text-sm text-white/60">{movie.releaseYear || 'N/A'}</span>
          </div>
          <p className="mb-4 text-sm text-white/70 line-clamp-2">{movie.description}</p>
          {movie.genres && (
            <div className="mb-4 flex flex-wrap gap-2">
              {movie.genres.map((genre) => (
                <span
                  key={genre}
                  className="rounded-full bg-white/10 px-2 py-1 text-xs text-white/60"
                >
                  {genre}
                </span>
              ))}
            </div>
          )}
        </div>
        {/* Vote Counts */}
        <div className="mb-4 flex items-center justify-between text-sm mt-2">
          <div className="flex items-center gap-2">
            <span className="text-green-400">Yes: {movie.votes?.yes || 0}</span>
            <span className="text-red-400">No: {movie.votes?.no || 0}</span>
          </div>
          {movie.rating && (
            <div className="flex items-center gap-1">
              <span className="text-yellow-400">★</span>
              <span className="text-white/60">{movie.rating.toFixed(1)}</span>
            </div>
          )}
        </div>
        {/* Vote Buttons */}
        <div className="flex gap-3 mt-2">
          <Button
            variant="default"
            className="flex-1"
            onClick={() => handleVote(true)}
            disabled={!isConnected || isVoting}
          >
            Yes
          </Button>
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => handleVote(false)}
            disabled={!isConnected || isVoting}
          >
            No
          </Button>
        </div>
      </div>
    </div>
  );
}