"use client";

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { motion, useMotionValue, useTransform } from 'motion/react';
import { ensureFullPosterUrl } from "~/lib/utils";
import { ThumbsUpIcon, ThumbsDownIcon } from "./icons";

// Helper component for swipe indicators
function SwipeIndicator({ 
  x, 
  direction, 
  className, 
  children 
}: { 
  x: ReturnType<typeof useMotionValue<number>>; 
  direction: 'left' | 'right'; 
  className: string; 
  children: React.ReactNode;
}) {
  const opacity = useTransform(x, direction === 'right' 
    ? [0, 100] 
    : [-100, 0], 
    direction === 'right' 
    ? [0, 1] 
    : [1, 0]
  );
  const rotate = useTransform(x, direction === 'right'
    ? [0, 100]
    : [-100, 0],
    direction === 'right'
    ? [-10, 0]
    : [0, 10]
  );

  return (
    <motion.div
      className={className}
      style={{ opacity, rotate }}
    >
      {children}
    </motion.div>
  );
}

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

interface SwipeableMovieCardProps {
  movie: Movie;
  onSwipe: (direction: 'left' | 'right') => void;
  onVoteComplete?: () => void;
  index: number;
  total: number;
}

export function SwipeableMovieCard({ 
  movie, 
  onSwipe, 
  onVoteComplete,
  index,
  total 
}: SwipeableMovieCardProps) {
  const [isVoting, setIsVoting] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);
  
  const fullPosterUrl = movie.posterUrl ? ensureFullPosterUrl(movie.posterUrl) : null;
  const movieId = movie.id || movie._id || '';

  const handleDragEnd = async (event: MouseEvent | TouchEvent | PointerEvent, info: { offset: { x: number }; velocity: { x: number } }) => {
    const threshold = 100;
    const velocity = info.velocity.x;

    if (Math.abs(info.offset.x) > threshold || Math.abs(velocity) > 500) {
      const direction = info.offset.x > 0 ? 'right' : 'left';
      
      if (isVoting) return; // Prevent multiple votes
      
      setIsVoting(true);
      setIsExiting(true);
      
      // Call the swipe handler
      await onSwipe(direction);
      
      // Call completion callback if provided
      if (onVoteComplete) {
        setTimeout(() => {
          onVoteComplete();
        }, 300);
      }
    } else {
      // Spring back to center
      x.set(0);
    }
  };

  // Reset position when movie changes
  useEffect(() => {
    x.set(0);
    setIsExiting(false);
    setIsVoting(false);
  }, [movie.id, x]);

  // Only show the top card
  if (index !== 0) {
    return null;
  }

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center"
      style={{
        x,
        rotate,
        opacity: index === 0 ? opacity : 0,
        zIndex: total - index,
        cursor: isVoting ? 'default' : 'grab',
      }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.2}
      onDragEnd={handleDragEnd}
      animate={isExiting ? {
        x: x.get() > 0 ? 1000 : -1000,
        opacity: 0,
        scale: 0.8,
      } : {}}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <div className="w-full max-w-sm mx-auto">
        <div className="relative bg-[#23232B] rounded-2xl overflow-hidden shadow-2xl border border-white/10">
          {/* Poster */}
          <div className="relative aspect-[2/3] w-full overflow-hidden">
            {fullPosterUrl ? (
              <Image
                src={fullPosterUrl}
                alt={movie.title}
                fill
                className="object-cover"
                priority
              />
            ) : (
              <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                <span className="text-gray-400 text-sm">No Poster</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
            
            {/* Swipe indicators */}
            {!isVoting && (
              <>
                <SwipeIndicator 
                  x={x} 
                  direction="right" 
                  className="absolute top-8 left-8 px-4 py-2 bg-green-500/90 rounded-lg border-2 border-white"
                >
                  <div className="flex items-center gap-2 text-white font-bold">
                    <ThumbsUpIcon size={24} />
                    <span>YES</span>
                  </div>
                </SwipeIndicator>
                <SwipeIndicator 
                  x={x} 
                  direction="left" 
                  className="absolute top-8 right-8 px-4 py-2 bg-red-500/90 rounded-lg border-2 border-white"
                >
                  <div className="flex items-center gap-2 text-white font-bold">
                    <ThumbsDownIcon size={24} />
                    <span>NO</span>
                  </div>
                </SwipeIndicator>
              </>
            )}
          </div>

          {/* Movie Info */}
          <div className="p-6 bg-[#23232B]">
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-2xl font-bold text-white line-clamp-2">{movie.title}</h3>
                {movie.releaseYear && (
                  <span className="text-sm text-white/60 flex-shrink-0 ml-2">{movie.releaseYear}</span>
                )}
              </div>
              <p className="text-sm text-white/70 line-clamp-3 mb-3">{movie.description}</p>
              
              {movie.genres && movie.genres.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {movie.genres.slice(0, 3).map((genre) => (
                    <span
                      key={genre}
                      className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/70"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Vote Counts */}
            <div className="flex items-center justify-between text-sm mb-4 pt-4 border-t border-white/10">
              <div className="flex items-center gap-4 text-white/70">
                <div className="flex items-center gap-1">
                  <ThumbsUpIcon size={16} />
                  <span>{movie.votes?.yes || 0}</span>
                </div>
                <div className="flex items-center gap-1">
                  <ThumbsDownIcon size={16} />
                  <span>{movie.votes?.no || 0}</span>
                </div>
              </div>
              {movie.rating && (
                <div className="flex items-center gap-1">
                  <span className="text-yellow-400">★</span>
                  <span className="text-white/60">{movie.rating.toFixed(1)}</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  if (!isVoting) {
                    setIsVoting(true);
                    setIsExiting(true);
                    onSwipe('left');
                    if (onVoteComplete) {
                      setTimeout(() => onVoteComplete(), 300);
                    }
                  }
                }}
                disabled={isVoting}
                className="flex-1 px-6 py-3 bg-red-500/20 hover:bg-red-500/30 border-2 border-red-500 rounded-lg text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <ThumbsDownIcon size={20} />
                <span>No</span>
              </button>
              <button
                onClick={() => {
                  if (!isVoting) {
                    setIsVoting(true);
                    setIsExiting(true);
                    onSwipe('right');
                    if (onVoteComplete) {
                      setTimeout(() => onVoteComplete(), 300);
                    }
                  }
                }}
                disabled={isVoting}
                className="flex-1 px-6 py-3 bg-green-500/20 hover:bg-green-500/30 border-2 border-green-500 rounded-lg text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <ThumbsUpIcon size={20} />
                <span>Yes</span>
              </button>
            </div>

            {isVoting && (
              <div className="mt-4 text-center text-white/60 text-sm">
                Saving your vote...
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

