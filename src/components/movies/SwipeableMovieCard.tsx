"use client";

import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import Image from 'next/image';
import { motion, useMotionValue, useTransform, animate } from 'motion/react';
import { ensureFullPosterUrl } from "~/lib/images/utils";

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
}

export interface SwipeableMovieCardRef {
  triggerVote: (direction: 'left' | 'right') => void;
}

interface SwipeableMovieCardProps {
  movie: Movie;
  onSwipe: (direction: 'left' | 'right') => void;
  index: number;
  total: number;
}

function BackgroundCard({ movie, index, total }: { movie: Movie; index: number; total: number }) {
  const fullPosterUrl = movie.posterUrl ? ensureFullPosterUrl(movie.posterUrl) : null;
  return (
    <div
      className="absolute inset-0 rounded-[18px] overflow-hidden pointer-events-none"
      style={{
        transform: `scale(${1 - index * 0.035}) translateY(${index * 14}px)`,
        zIndex: total - index,
        transformOrigin: 'bottom center',
      }}
    >
      <PosterFill posterUrl={fullPosterUrl} title={movie.title} />
    </div>
  );
}

export const SwipeableMovieCard = forwardRef<SwipeableMovieCardRef, SwipeableMovieCardProps>(
  function SwipeableMovieCard({ movie, onSwipe, index, total }, ref) {
    const [isDragging, setIsDragging] = useState(false);
    const [isExiting, setIsExiting] = useState(false);
    const x = useMotionValue(0);
    const rotate = useTransform(x, [-280, 0, 280], [-14, 0, 14]);

    // Stamps: LIKE on right drag, NOPE on left drag — matches Tinder exactly
    const likeOpacity = useTransform(x, [15, 100], [0, 1]);
    const nopeOpacity = useTransform(x, [-100, -15], [1, 0]);

    const fullPosterUrl = movie.posterUrl ? ensureFullPosterUrl(movie.posterUrl) : null;

    const triggerVote = (direction: 'left' | 'right') => {
      if (isExiting) return;
      setIsExiting(true);
      if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(18);
      animate(x, direction === 'right' ? 1100 : -1100, {
        type: 'spring',
        stiffness: 220,
        damping: 28,
        onComplete: () => onSwipe(direction),
      });
    };

    useImperativeHandle(ref, () => ({ triggerVote }));

    const handleDragEnd = (_: unknown, info: { offset: { x: number }; velocity: { x: number } }) => {
      setIsDragging(false);
      if (isExiting) return;
      const { offset, velocity } = info;
      if (Math.abs(offset.x) > 85 || Math.abs(velocity.x) > 420) {
        triggerVote(offset.x > 0 ? 'right' : 'left');
      } else {
        animate(x, 0, { type: 'spring', stiffness: 450, damping: 32 });
      }
    };

    useEffect(() => {
      const unsub = x.on('change', (val) => {
        if (!isDragging) return;
        if (Math.abs(val) >= 85 && Math.abs(val) <= 90) {
          if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(8);
        }
      });
      return unsub;
    }, [x, isDragging]);

    useEffect(() => {
      x.set(0);
      setIsExiting(false);
    }, [movie.id]); // eslint-disable-line react-hooks/exhaustive-deps

    if (index !== 0) {
      return <BackgroundCard movie={movie} index={index} total={total} />;
    }

    return (
      <motion.div
        className="absolute inset-0 rounded-[18px] overflow-hidden cursor-grab active:cursor-grabbing select-none touch-none"
        style={{ x, rotate, zIndex: total, boxShadow: '0 8px 40px rgba(0,0,0,0.55)' }}
        drag="x"
        dragConstraints={{ left: -600, right: 600 }}
        dragElastic={0.18}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={handleDragEnd}
      >
        <PosterFill posterUrl={fullPosterUrl} title={movie.title} />

        {/* Info overlay — gradient only over bottom 45%, no blur anywhere */}
        <div
          className="absolute inset-x-0 bottom-0 px-5 pb-6 pt-20"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.55) 45%, transparent 100%)' }}
        >
          <div className="flex items-baseline gap-2.5 mb-1.5">
            <h2 className="text-white font-bold text-[22px] leading-tight tracking-tight">
              {movie.title}
            </h2>
            {movie.releaseYear && (
              <span className="text-white/60 text-base font-normal flex-shrink-0">{movie.releaseYear}</span>
            )}
          </div>

          {movie.genres && movie.genres.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {movie.genres.slice(0, 3).map((genre) => (
                <span
                  key={genre}
                  className="text-[11px] font-medium text-white/75 border border-white/25 rounded-full px-2.5 py-[3px]"
                >
                  {genre}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* LIKE stamp — top-left, Tinder green, -12° */}
        <motion.div
          className="absolute top-8 left-5 border-[3.5px] border-[#4CDF6F] rounded-[6px] px-3 py-1.5"
          style={{ opacity: likeOpacity, rotate: -12, transformOrigin: 'center' }}
        >
          <span
            className="text-[#4CDF6F] text-[34px] leading-none tracking-[0.12em] uppercase"
            style={{ fontWeight: 900, fontFamily: '"Arial Black", "Arial Bold", sans-serif' }}
          >
            YES
          </span>
        </motion.div>

        {/* NOPE stamp — top-right, Tinder red, +12° */}
        <motion.div
          className="absolute top-8 right-5 border-[3.5px] border-[#FF4458] rounded-[6px] px-3 py-1.5"
          style={{ opacity: nopeOpacity, rotate: 12, transformOrigin: 'center' }}
        >
          <span
            className="text-[#FF4458] text-[34px] leading-none tracking-[0.12em] uppercase"
            style={{ fontWeight: 900, fontFamily: '"Arial Black", "Arial Bold", sans-serif' }}
          >
            NO
          </span>
        </motion.div>
      </motion.div>
    );
  }
);

function PosterFill({ posterUrl, title }: { posterUrl: string | null; title: string }) {
  return (
    <div className="w-full h-full bg-[#0f0f0f]">
      {posterUrl ? (
        <Image
          src={posterUrl}
          alt={title}
          fill
          className="object-cover object-center"
          priority
          draggable={false}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
            <rect x="2" y="3" width="20" height="18" rx="2" stroke="white" strokeOpacity="0.2" strokeWidth="1.5"/>
            <circle cx="8.5" cy="9.5" r="1.5" stroke="white" strokeOpacity="0.2" strokeWidth="1.5"/>
            <path d="M2 15l5-5 4 4 3-3 6 6" stroke="white" strokeOpacity="0.2" strokeWidth="1.5" strokeLinejoin="round"/>
          </svg>
        </div>
      )}
    </div>
  );
}

