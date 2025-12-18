"use client";

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { motion, useMotionValue, useTransform } from 'motion/react';
import { ensureFullPosterUrl } from "~/lib/images/utils";
import { ThumbsUpIcon, ThumbsDownIcon } from "./icons";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "~/components/ui/card";
import { Button } from "~/components/ui/Button";
import MobileSwiper from "./MobileSwiper";

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
    ? [0, 150] 
    : [-150, 0], 
    direction === 'right' 
    ? [0, 1] 
    : [1, 0]
  );
  const scale = useTransform(x, direction === 'right'
    ? [0, 150]
    : [-150, 0],
    direction === 'right'
    ? [0.8, 1]
    : [1, 0.8]
  );

  return (
    <motion.div
      className={className}
      style={{ opacity, scale }}
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
  const scale = useTransform(x, [-300, 0, 300], [0.7, 1, 0.7]);
  const rotate = useTransform(x, [-300, 0, 300], [-25, 0, 25]);
  const opacity = useTransform(x, [-300, -150, 0, 150, 300], [0, 1, 1, 1, 0]);
  const blur = useTransform(x, [-300, 0, 300], [10, 0, 10]);
  
  const fullPosterUrl = movie.posterUrl ? ensureFullPosterUrl(movie.posterUrl) : null;
  const movieId = movie.id || movie._id || '';

  const handleDragEnd = async (event: MouseEvent | TouchEvent | PointerEvent, info: { offset: { x: number }; velocity: { x: number } }) => {
    const threshold = 100;
    const velocity = info.velocity.x;

    console.log('Drag ended:', { offset: info.offset.x, velocity, threshold });

    if (Math.abs(info.offset.x) > threshold || Math.abs(velocity) > 500) {
      const direction = info.offset.x > 0 ? 'right' : 'left';
      
      console.log('Swipe detected:', direction);
      
      if (isVoting) {
        console.log('Already voting, ignoring swipe');
        return; // Prevent multiple votes
      }
      
      setIsVoting(true);
      setIsExiting(true);
      
      // Call the swipe handler
      console.log('Calling onSwipe with direction:', direction);
      try {
        await onSwipe(direction);
      } catch (error) {
        console.error('Error in onSwipe:', error);
        // Reset state on error
        setIsVoting(false);
        setIsExiting(false);
        x.set(0);
        return;
      }
      
      // Call completion callback if provided
      if (onVoteComplete) {
        setTimeout(() => {
          onVoteComplete();
        }, 300);
      }
    } else {
      console.log('Swipe threshold not met, springing back');
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

  // Reset voting state when it becomes false externally (after transaction completes)
  useEffect(() => {
    if (!isVoting) {
      setIsExiting(false);
    }
  }, [isVoting]);

  const handleMobileSwipe = async ({ deltaX, deltaY }: { deltaX: number; deltaY: number }) => {
    // Only handle horizontal swipes (ignore vertical scrolling)
    if (Math.abs(deltaY) > Math.abs(deltaX)) {
      return; // Vertical swipe, ignore
    }

    const threshold = 100;
    console.log('Mobile swipe detected:', { deltaX, deltaY, threshold });

    if (Math.abs(deltaX) > threshold) {
      const direction = deltaX > 0 ? 'right' : 'left';
      
      console.log('Mobile swipe direction:', direction);
      
      if (isVoting) {
        console.log('Already voting, ignoring swipe');
        return;
      }
      
      setIsVoting(true);
      setIsExiting(true);
      
      // Animate the card off screen
      x.set(deltaX > 0 ? 1000 : -1000);
      
      // Call the swipe handler
      console.log('Calling onSwipe with direction:', direction);
      try {
        await onSwipe(direction);
      } catch (error) {
        console.error('Error in onSwipe:', error);
        // Reset state on error
        setIsVoting(false);
        setIsExiting(false);
        x.set(0);
        return;
      }
      
      // Call completion callback if provided
      if (onVoteComplete) {
        setTimeout(() => {
          onVoteComplete();
        }, 300);
      }
    }
  };

  return (
    <MobileSwiper onSwipe={index === 0 ? handleMobileSwipe : () => {}}>
      <motion.div
        className="absolute inset-0 flex items-center justify-center touch-pan-y select-none"
        style={{
          x: index === 0 ? x : 0,
          scale: index === 0 ? scale : index < 3 ? 1 - index * 0.05 : 0.9,
          rotate: index === 0 ? rotate : 0,
          opacity: index === 0 ? opacity : index < 3 ? 1 - index * 0.1 : 0,
          filter: index === 0 ? `blur(${blur}px)` : undefined,
          zIndex: total - index,
          touchAction: index === 0 ? 'pan-y' : 'none',
          transform: index > 0 ? `scale(${1 - index * 0.05}) translateY(${index * 10}px)` : undefined,
        }}
        drag={index === 0 ? "x" : false}
        dragConstraints={index === 0 ? { left: -400, right: 400 } : undefined}
        dragElastic={index === 0 ? 0.35 : undefined}
        onDragEnd={index === 0 ? handleDragEnd : undefined}
        animate={index === 0 && isExiting ? {
          x: x.get() > 0 ? 1000 : -1000,
          opacity: 0,
          scale: 0.5,
          rotate: x.get() > 0 ? 45 : -45,
        } : index === 0 ? {
          x: 0,
          opacity: 1,
          scale: 1,
          rotate: 0,
        } : {}}
        transition={{ type: "spring", stiffness: 280, damping: 28 }}
        whileDrag={index === 0 ? { cursor: 'grabbing' } : undefined}
        dragPropagation={false}
      >
      <div className="w-full max-w-sm mx-auto">
        <Card className="relative overflow-hidden shadow-2xl select-none border-white/10 bg-[#23232B]">
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
                  direction="left" 
                  className="absolute top-8 left-8 px-6 py-3 bg-green-500/90 rounded-xl border-2 border-white shadow-lg"
                >
                  <div className="flex items-center gap-2 text-white font-bold">
                    <ThumbsUpIcon size={28} />
                    <div className="flex flex-col">
                      <span className="text-lg">SWIPE LEFT</span>
                      <span className="text-sm opacity-80">YES</span>
                    </div>
                  </div>
                </SwipeIndicator>
                <SwipeIndicator 
                  x={x} 
                  direction="right" 
                  className="absolute top-8 right-8 px-6 py-3 bg-red-500/90 rounded-xl border-2 border-white shadow-lg"
                >
                  <div className="flex items-center gap-2 text-white font-bold">
                    <div className="flex flex-col">
                      <span className="text-lg">SWIPE RIGHT</span>
                      <span className="text-sm opacity-80">NO</span>
                    </div>
                    <ThumbsDownIcon size={28} />
                  </div>
                </SwipeIndicator>
              </>
            )}
          </div>

          {/* Movie Info */}
          <CardContent className="p-6 bg-[#23232B]">
            <CardHeader className="p-0 mb-4">
              <div className="flex items-center justify-between mb-2">
                <CardTitle className="text-2xl font-bold text-white line-clamp-2">{movie.title}</CardTitle>
                {movie.releaseYear && (
                  <span className="text-sm text-white/60 flex-shrink-0 ml-2">{movie.releaseYear}</span>
                )}
              </div>
              <CardDescription className="text-sm text-white/70 line-clamp-3 mb-3">
                {movie.description}
              </CardDescription>
              
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
            </CardHeader>

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
            <CardFooter className="p-0 flex gap-3 pointer-events-auto">
              <Button
                onClick={(e) => {
                  e.stopPropagation();
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
                variant="outline"
                className="flex-1 bg-green-500/20 hover:bg-green-500/30 border-2 border-green-500 text-white"
              >
                <ThumbsUpIcon size={20} />
                <span>Yes</span>
              </Button>
              <Button
                onClick={(e) => {
                  e.stopPropagation();
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
                variant="outline"
                className="flex-1 bg-red-500/20 hover:bg-red-500/30 border-2 border-red-500 text-white"
              >
                <ThumbsDownIcon size={20} />
                <span>No</span>
              </Button>
            </CardFooter>

            {isVoting && (
              <div className="mt-4 text-center text-white/60 text-sm">
                Saving your vote...
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      </motion.div>
    </MobileSwiper>
  );
}

