import { Button } from "./ui/Button";
import Image from 'next/image';

interface Movie {
  id: string;
  title: string;
  description: string;
  releaseYear: string;
  director?: string;
  cast?: string[];
  genres?: string[];
  rating?: number;
  posterUrl: string;
  backdropUrl?: string;
  trailerUrl?: string;
  screenshots?: string[];
  voteCountYes?: number;
  voteCountNo?: number;
}

interface MovieCardProps {
  movie: Movie;
  onVote: (vote: boolean) => void;
  isVoting: boolean;
  isConnected: boolean;
}

export function MovieCard({ movie, onVote, isVoting, isConnected }: MovieCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[#1A1A1A] transition-all duration-300 hover:border-white/20">
      {/* Movie Poster */}
      <div className="relative aspect-[2/3] w-full overflow-hidden">
        <Image
          src={movie.posterUrl}
          alt={movie.title}
          width={300}
          height={450}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
      </div>

      {/* Movie Info */}
      <div className="p-4">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">{movie.title}</h3>
          <span className="text-sm text-white/60">{movie.releaseYear}</span>
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

        {/* Vote Counts */}
        <div className="mb-4 flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <span className="text-green-400">Yes: {movie.voteCountYes || 0}</span>
            <span className="text-red-400">No: {movie.voteCountNo || 0}</span>
          </div>
          {movie.rating && (
            <div className="flex items-center gap-1">
              <span className="text-yellow-400">★</span>
              <span className="text-white/60">{movie.rating.toFixed(1)}</span>
            </div>
          )}
        </div>

        {/* Vote Buttons */}
        <div className="flex gap-3">
          <Button
            variant="primary"
            className="flex-1"
            onClick={() => onVote(true)}
            disabled={!isConnected || isVoting}
          >
            Yes
          </Button>
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => onVote(false)}
            disabled={!isConnected || isVoting}
          >
            No
          </Button>
        </div>
      </div>
    </div>
  );
} 