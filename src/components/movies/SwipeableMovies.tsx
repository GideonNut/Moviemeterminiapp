"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAccount, useChainId, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';import { AnimatePresence } from 'motion/react';
import { SwipeableMovieCard, type SwipeableMovieCardRef } from './SwipeableMovieCard';
import { SwipeGestureHint, HINT_KEY } from './SwipeGestureHint';
import { MetalFx } from 'metal-fx';
import { VOTE_CONTRACT_ABI, getVoteContractAddress } from '~/constants/voteContract';
import { getContractIdForMovie } from '~/lib/movies/utils';
import { submitReferral } from '@divvi/referral-sdk';
import type { MediaItem } from '~/types';

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

interface Toast {
  id: number;
  message: string;
  type: 'info' | 'success' | 'error';
}

let toastCounter = 0;

interface SwipeableMoviesProps {
  movies: Movie[];
  allMedia?: MediaItem[];
  onMoviesExhausted?: () => void;
}

function XIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 26 26" fill="none">
      <path d="M6 6L20 20M20 6L6 20" stroke="#FF4458" strokeWidth="2.6" strokeLinecap="round"/>
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 26 26" fill="none">
      <path
        d="M13 22.5C13 22.5 3 16.5 3 9.5C3 6.46243 5.46243 4 8.5 4C10.4 4 12.1 5 13 6.5C13.9 5 15.6 4 17.5 4C20.5376 4 23 6.46243 23 9.5C23 16.5 13 22.5 13 22.5Z"
        fill="#4CDF6F"
        stroke="#4CDF6F"
        strokeWidth="0.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function AllCaughtUpIcon() {
  return (
    <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
      {/* Outer ring */}
      <circle cx="26" cy="26" r="24" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" />
      {/* Tick */}
      <path
        d="M16 26.5L22.5 33L36 19"
        stroke="rgba(255,255,255,0.5)"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Small sparkle top-right */}
      <path d="M38 10l1 3 3 1-3 1-1 3-1-3-3-1 3-1z" fill="rgba(255,255,255,0.25)" />
      {/* Small sparkle bottom-left */}
      <path d="M12 38l0.7 2 2 0.7-2 0.7-0.7 2-0.7-2-2-0.7 2-0.7z" fill="rgba(255,255,255,0.18)" />
    </svg>
  );
}

function BookmarkIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path
        d="M6 4h12a1 1 0 0 1 1 1v15l-7-3.5L5 20V5a1 1 0 0 1 1-1z"
        fill={filled ? "#FACC15" : "none"}
        stroke={filled ? "#FACC15" : "#ffffff"}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SwipeableMovies({ movies, allMedia = [], onMoviesExhausted }: SwipeableMoviesProps) {
  const { address } = useAccount();
  const chainId = useChainId();
  const { writeContract, data: txHash } = useWriteContract();
  const { isSuccess: txConfirmed, isError: txFailed } = useWaitForTransactionReceipt({ hash: txHash });
  const nopeRef = useRef<HTMLButtonElement>(null);
  const likeRef = useRef<HTMLButtonElement>(null);
  const cardRef = useRef<SwipeableMovieCardRef>(null);

  const [currentMovies, setCurrentMovies] = useState<Movie[]>([]);
  const [votedMovies, setVotedMovies] = useState<Set<string>>(new Set());
  const [isVoting, setIsVoting] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [showGestureHint, setShowGestureHint] = useState(false);
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [savingWatchlist, setSavingWatchlist] = useState(false);
  const [pendingVote, setPendingVote] = useState<{ movieId: string; vote: string } | null>(null);

  useEffect(() => {
    const unvoted = movies.filter(m => !votedMovies.has(m.id || m._id || ''));
    setCurrentMovies(unvoted);
  }, [movies, votedMovies]);

  // Show swipe gesture hint once on first visit
  useEffect(() => {
    if (currentMovies.length === 0) return;
    try {
      if (localStorage.getItem(HINT_KEY) !== 'true') {
        const t = setTimeout(() => setShowGestureHint(true), 500);
        return () => clearTimeout(t);
      }
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMovies.length > 0]);

  // Reset watchlist state when top card changes
  const topCardId = currentMovies[0]?.id;
  useEffect(() => { setIsInWatchlist(false); }, [topCardId]);

  const addToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = ++toastCounter;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3200);
  }, []);

  const handleWatchlist = useCallback(async () => {
    const movie = currentMovies[0];
    if (!movie) return;
    if (!address) { addToast('Connect wallet to save', 'error'); return; }
    setSavingWatchlist(true);
    try {
      if (isInWatchlist) {
        await fetch(`/api/watchlist?address=${address}&movieId=${movie.id || movie._id}`, { method: 'DELETE' });
        setIsInWatchlist(false);
        addToast('Removed from watchlist', 'info');
      } else {
        const res = await fetch('/api/watchlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address, movieId: movie.id || movie._id, movieTitle: movie.title }),
        });
        if (res.status === 409) { setIsInWatchlist(true); }
        else if (res.ok) { setIsInWatchlist(true); addToast('Saved to watchlist', 'success'); }
      }
    } catch { addToast('Watchlist error', 'error'); }
    finally { setSavingWatchlist(false); }
  }, [currentMovies, address, isInWatchlist, addToast]);

  // React to tx confirmation/failure
  useEffect(() => {
    if (!pendingVote) return;
    if (txConfirmed) {
      if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([25, 40, 25]);
      addToast(pendingVote.vote === 'yes' ? 'Voted Yes ✓' : 'Voted No ✓', 'success');
      fetch('/api/movies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: 'vote', id: pendingVote.movieId, type: pendingVote.vote, userAddress: address }),
      }).catch(() => null);
      setPendingVote(null);
      setIsVoting(false);
    }
    if (txFailed) {
      addToast('Transaction failed', 'error');
      setPendingVote(null);
      setIsVoting(false);
    }
  }, [txConfirmed, txFailed, pendingVote, address, addToast]);

  const handleSwipe = useCallback(async (direction: 'left' | 'right') => {
    if (currentMovies.length === 0 || isVoting) return;

    const currentMovie = currentMovies[0];
    const movieId = currentMovie.id || currentMovie._id || '';
    const vote = direction === 'right' ? 'yes' : 'no';

    setVotedMovies(prev => new Set(prev).add(movieId));
    setCurrentMovies(prev => prev.slice(1));

    if (currentMovies.length <= 1 && onMoviesExhausted) {
      setTimeout(onMoviesExhausted, 600);
    }

    if (movieId.startsWith('fallback-')) return;

    // Validate network — MiniPay supports Celo mainnet (42220) and Sepolia (11142220)
    const contractAddress = getVoteContractAddress(chainId);
    if (!contractAddress) {
      addToast('Switch to Celo to vote on-chain', 'error');
      return;
    }
    if (!address) { addToast('Wallet not connected', 'error'); return; }

    let contractId = -1;
    if (allMedia.length > 0) {
      contractId = getContractIdForMovie(movieId, allMedia);
    } else {
      const cast = movies as unknown as MediaItem[];
      if (cast.length > 0 && cast[0].createdAt) contractId = getContractIdForMovie(movieId, cast);
    }
    if (contractId === -1) {
      addToast(`No contract ID for "${currentMovie.title}"`, 'error');
      return;
    }

    setIsVoting(true);
    setPendingVote({ movieId, vote });

    try {
      addToast('Confirm in MiniPay…', 'info');
      // MiniPay docs pattern: useWriteContract for contract writes
      writeContract({
        address: contractAddress,
        abi: VOTE_CONTRACT_ABI,
        functionName: 'vote',
        args: [BigInt(contractId), vote === 'yes'],
      });
      // submitReferral after initiating tx
      submitReferral({ txHash: txHash ?? '0x', chainId }).catch(() => null);
    } catch (err) {
      // MiniPay docs: prefer error.code / error.name over error.message text matching
      const e = err as Error & { code?: number; name?: string };
      if (e.code === -32604 || e.name === 'UserRejectedRequestError' || e.name === 'TransactionExecutionError') {
        addToast('Cancelled', 'info');
      } else if (e.code === -32603 || e.name === 'InsufficientFundsError') {
        addToast('Not enough CELO for network fee', 'error');
      } else {
        addToast('Transaction failed', 'error');
      }
      setPendingVote(null);
      setIsVoting(false);
    }
  }, [currentMovies, isVoting, address, chainId, allMedia, movies, onMoviesExhausted, addToast, writeContract, txHash]);

  if (currentMovies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 gap-4 px-6 text-center">
        <AllCaughtUpIcon />
        <h2 className="text-white text-xl font-bold tracking-tight">All caught up</h2>
        <p className="text-white/40 text-sm">You&apos;ve rated everything. Check back soon.</p>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col flex-1">
      {/* Card stack — needs explicit height so absolute-positioned cards are visible */}
      <div className="relative flex-1 mx-4 mt-2 mb-1 min-h-0">
        {currentMovies.slice(0, 3).map((movie, index) => (
          <SwipeableMovieCard
            key={movie.id || movie._id || index}
            ref={index === 0 ? cardRef : undefined}
            movie={movie}
            onSwipe={handleSwipe}
            index={index}
            total={Math.min(currentMovies.length, 3)}
          />
        ))}

        {/* First-time swipe gesture onboarding */}
        <AnimatePresence>
          {showGestureHint && (
            <SwipeGestureHint onDismiss={() => setShowGestureHint(false)} />
          )}
        </AnimatePresence>
      </div>

      {/* Action buttons: NO · Watchlist · YES */}
      <div className="flex items-center justify-center gap-5 py-7">
        {/* NO */}
        <MetalFx variant="circle" preset="chromatic" theme="dark" strength={0.9} reflectionTargets={[likeRef]}>
          <button
            ref={nopeRef}
            aria-label="No"
            disabled={isVoting}
            onClick={() => cardRef.current?.triggerVote('left')}
            className="w-[62px] h-[62px] rounded-full bg-[#181818] flex items-center justify-center active:scale-95 transition-transform disabled:opacity-40"
          >
            <XIcon />
          </button>
        </MetalFx>

        {/* Watchlist — secondary action, smaller */}
        <MetalFx variant="circle" preset="silver" theme="dark" strength={0.7}>
          <button
            aria-label={isInWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}
            disabled={savingWatchlist}
            onClick={handleWatchlist}
            className="w-[50px] h-[50px] rounded-full bg-[#181818] flex items-center justify-center active:scale-95 transition-transform disabled:opacity-40"
          >
            <BookmarkIcon filled={isInWatchlist} />
          </button>
        </MetalFx>

        {/* YES */}
        <MetalFx variant="circle" preset="chromatic" theme="dark" strength={0.9} reflectionTargets={[nopeRef]}>
          <button
            ref={likeRef}
            aria-label="Yes"
            disabled={isVoting}
            onClick={() => cardRef.current?.triggerVote('right')}
            className="w-[62px] h-[62px] rounded-full bg-[#181818] flex items-center justify-center active:scale-95 transition-transform disabled:opacity-40"
          >
            <HeartIcon />
          </button>
        </MetalFx>
      </div>

      {/* Toasts */}
      <div className="fixed bottom-28 left-1/2 -translate-x-1/2 flex flex-col gap-2 items-center z-50 pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`px-4 py-2 rounded-full text-[13px] font-medium shadow-lg ${
              t.type === 'error'
                ? 'bg-[#FF4458]/15 text-[#FF4458] border border-[#FF4458]/30'
                : t.type === 'success'
                ? 'bg-[#4CDF6F]/15 text-[#4CDF6F] border border-[#4CDF6F]/30'
                : 'bg-white/8 text-white/70 border border-white/10'
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </div>
  );
}
