"use client";

import { useState, useEffect } from 'react';
import { useFarcasterAuth } from '~/contexts/FarcasterAuthContext';
import { useAccount, useWalletClient, useChainId } from 'wagmi';
import { encodeFunctionData, createPublicClient, http } from 'viem';
import { celo } from 'viem/chains';
import { SwipeableMovieCard } from './SwipeableMovieCard';
import { Button } from './ui/Button';
import { VOTE_CONTRACT_ADDRESS, VOTE_CONTRACT_ABI } from '~/constants/voteContract';
import { getContractIdForMovie, hasSufficientCELOForGas } from '~/lib/utils';
import { submitReferral } from '@divvi/referral-sdk';
import type { MediaItem } from '~/types';

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
  allMedia?: MediaItem[]; // All media items for contractId calculation
  onMoviesExhausted?: () => void;
}

export function SwipeableMovies({ movies, allMedia = [], onMoviesExhausted }: SwipeableMoviesProps) {
  const { user, isConnected, isLoading, connect } = useFarcasterAuth();
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const chainId = useChainId();
  const [currentMovies, setCurrentMovies] = useState<Movie[]>([]);
  const [votedMovies, setVotedMovies] = useState<Set<string>>(new Set());
  const [isVoting, setIsVoting] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [txStatus, setTxStatus] = useState<string>('');

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

    // Check if user is connected, if not, prompt to connect
    if (!isConnected || !user) {
      try {
        setIsConnecting(true);
        await connect();
        // After connecting, retry the vote
        setTimeout(() => handleSwipe(direction), 100);
        return;
      } catch (error) {
        console.error('Error connecting to Farcaster:', error);
        alert('Please connect your Farcaster wallet to vote');
        setIsConnecting(false);
        return;
      } finally {
        setIsConnecting(false);
      }
    }

    const currentMovie = currentMovies[0];
    const movieId = currentMovie.id || currentMovie._id || '';
    const vote = direction === 'left' ? 'yes' : 'no';

    setIsVoting(true);
    setTxStatus('Preparing transaction...');

    try {
      // Check if we're on a Celo network
      if (chainId !== 42220 && chainId !== 44787) {
        throw new Error('Please switch to a Celo network (testnet or mainnet) before voting.');
      }

      if (!address || !walletClient) {
        throw new Error('Wallet not connected');
      }

      // Get contract ID for the movie
      // If allMedia is provided, use it; otherwise try to use movies array if they have createdAt
      let contractId = -1;
      if (allMedia.length > 0) {
        contractId = getContractIdForMovie(movieId, allMedia);
      } else {
        // Fallback: try to use movies array if they have createdAt (cast to MediaItem[])
        const moviesWithCreatedAt = movies as unknown as MediaItem[];
        if (moviesWithCreatedAt.length > 0 && moviesWithCreatedAt[0].createdAt) {
          contractId = getContractIdForMovie(movieId, moviesWithCreatedAt);
        }
      }
      
      if (contractId === -1) {
        throw new Error(
          `Could not determine contract ID for "${currentMovie.title}". ` +
          `Please ensure all media items are loaded with creation dates.`
        );
      }

      const movieIdBigInt = BigInt(contractId);
      console.log('Sending vote transaction:', { movieId, contractId, vote });

      // Build calldata for the vote transaction
      setTxStatus('Please sign the transaction...');
      const calldata = encodeFunctionData({
        abi: VOTE_CONTRACT_ABI,
        functionName: 'vote',
        args: [movieIdBigInt, vote === 'yes']
      });

      // Send transaction using wagmi wallet client
      const txHash = await walletClient.sendTransaction({
        account: address,
        to: VOTE_CONTRACT_ADDRESS,
        data: calldata as `0x${string}`,
        value: 0n
      });

      console.log('Transaction hash:', txHash);
      setTxStatus('Transaction submitted! Waiting for confirmation...');

      // Wait for transaction confirmation
      const publicClient = createPublicClient({
        chain: celo,
        transport: http()
      });

      setTxStatus('Waiting for transaction confirmation...');
      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
      console.log('Transaction confirmed:', receipt);

      if (receipt.status === 'reverted') {
        throw new Error('Transaction was reverted on-chain');
      }

      setTxStatus('Transaction confirmed! Saving to database...');

      // Submit referral to Divvi
      submitReferral({ txHash, chainId }).catch((e) => 
        console.error('Divvi submitReferral failed:', e)
      );

      // After successful blockchain transaction, save the vote to Firestore
      const userIdentifier = user?.fid?.toString() || user?.address || address || '';
      
      const response = await fetch("/api/movies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify({
          action: "vote",
          id: movieId,
          type: vote,
          userAddress: userIdentifier
        })
      });

      const result = await response.json();

      if (response.ok) {
        // Mark this movie as voted
        setVotedMovies(prev => new Set(prev).add(movieId));
        
        // Remove the current movie from the stack (it's already been voted on)
        setCurrentMovies(prev => prev.slice(1));

        setTxStatus('Vote successful!');
        console.log(`Successfully voted ${vote} for movie ${movieId} - transaction confirmed and saved to Firebase`);
        
        // Clear status after a delay
        setTimeout(() => setTxStatus(''), 2000);
      } else {
        throw new Error(result.error || 'Failed to save vote to database');
      }
    } catch (error) {
      console.error('Error voting:', error);
      setTxStatus('');
      
      // Handle specific error types
      if (error instanceof Error) {
        if (error.message.includes('User rejected')) {
          alert('Transaction was cancelled. Please try again.');
        } else if (error.message.includes('insufficient funds') || error.message.includes('gas')) {
          alert('Insufficient CELO for gas fees. Please add more CELO to your wallet.');
        } else {
          alert(error.message);
        }
      } else {
        alert('An error occurred while voting. Please try again.');
      }
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

  // Show connect prompt if not connected
  if (!isConnected && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[600px] text-white">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Connect Your Farcaster Wallet</h2>
          <p className="text-white/70 mb-6">Connect your Farcaster wallet to start voting on movies.</p>
          <Button
            onClick={async () => {
              try {
                setIsConnecting(true);
                await connect();
              } catch (error) {
                console.error('Error connecting:', error);
                alert('Failed to connect. Please try again.');
              } finally {
                setIsConnecting(false);
              }
            }}
            disabled={isConnecting}
            className="px-6 py-3"
          >
            {isConnecting ? 'Connecting...' : 'Connect Farcaster Wallet'}
          </Button>
        </div>
      </div>
    );
  }

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
    <div className="relative w-full max-w-sm mx-auto h-[80vh] min-h-[520px] overflow-hidden flex items-center justify-center">
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
      
      {txStatus && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-4 py-2 rounded-lg text-sm z-50">
          {txStatus}
        </div>
      )}
    </div>
  );
}

