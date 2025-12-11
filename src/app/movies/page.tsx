"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAccount, useChainId, useSwitchChain, useBalance, useWalletClient } from "wagmi";
import { encodeFunctionData, createPublicClient, http } from "viem";
import { celo } from "viem/chains";
import { getDataSuffix, submitReferral } from "@divvi/referral-sdk";
import { ArrowLeft, RefreshCw, Film, Tv, MessageSquare, Star, LayoutGrid, Hand } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useSession } from 'next-auth/react';

// Components
import WatchlistButton from "~/components/WatchlistButton";
import { Card, CardContent, CardTitle, CardDescription } from "~/components/ui/card";
import { Button } from "~/components/ui/Button";
import Header from "~/components/Header";
import { ThumbsDownIcon, ThumbsUpIcon } from "~/components/icons";
import { HorizontalMovieCardSkeleton } from "~/components/MovieCardSkeleton";
import { SwipeableMovies } from "~/components/SwipeableMovies";

// Utils
import { VOTE_CONTRACT_ADDRESS, VOTE_CONTRACT_ABI } from "~/constants/voteContract";
import { formatCELOBalance, hasSufficientCELOForGas, ensureFullPosterUrl, getContractIdForMovie } from "~/lib/utils";
import { saveMovie, getMovie, getAllMovies } from "~/lib/firestore";

// Types
import type { Media, Movie, TVShow } from "~/types";

export default function MediaPage() {
  const router = useRouter();
  const { data: session } = useSession();
  // Align with the updated Media interface where contractId is already a required number
  type MediaWithDerivedId = Movie | TVShow;
  const [media, setMedia] = useState<MediaWithDerivedId[]>([]);
  const [loading, setLoading] = useState(true);
  const [votes, setVotes] = useState<{ [id: string]: 'yes' | 'no' | null }>({});
  const [txStatus, setTxStatus] = useState<{ [id: string]: string }>({});
  const [currentVotingId, setCurrentVotingId] = useState<string | null>(null);
  const [referralTag, setReferralTag] = useState<string | null>(null);
  const [voteAttempts, setVoteAttempts] = useState<{ [id: string]: { show: boolean; timeoutId?: NodeJS.Timeout } }>({});
  const [viewMode, setViewMode] = useState<'swipe' | 'list'>('swipe');

  const { address, isConnected } = useAccount();
  const currentChainId = useChainId();
  const { switchChainAsync } = useSwitchChain();
  const { data: walletClient } = useWalletClient();
  const { data: celoBalance } = useBalance({
    address: address,
    query: { enabled: !!address }
  });

  // Fetch all media (movies and TV shows)
  const fetchAllMedia = useCallback(async () => {
    try {
      setLoading(true);
      // Get all movies and sort them by creation date
      const movies = await getAllMovies();
      const sortedMovies = [...movies].sort((a, b) => {
        const aTime = a.createdAt?.toDate().getTime() || 0;
        const bTime = b.createdAt?.toDate().getTime() || 0;
        return aTime - bTime;
      });
      
      // Process and type the sorted movies with derived contract IDs
      const moviesWithContractIds = sortedMovies.map((item, index) => {
        const baseItem = {
          id: item.id || '',
          title: item.title || 'Untitled',
          description: item.description || '',
          posterUrl: item.posterUrl,
          votes: item.votes || { yes: 0, no: 0 },
          commentCount: item.commentCount || 0,
          genres: item.genres || [],
          contractId: index, // Now a required number
          createdAt: item.createdAt || new Date(),
          updatedAt: item.updatedAt || new Date()
        };

        if (item.isTVShow) {
          // For TV shows
          const tvShow: TVShow = {
            ...baseItem,
            isTVShow: true,
            firstAirDate: (item as any).firstAirDate,
            seasons: (item as any).seasons,
            episodes: (item as any).episodes
          };
          return tvShow;
        } else {
          // For movies
          const movie: Movie = {
            ...baseItem,
            isTVShow: false,
            releaseYear: (item as any).releaseYear
          };
          return movie;
        }
      });
      
      setMedia(moviesWithContractIds);
      
      // Helper function to process media items with proper typing
      const processMedia = (items: any[], isTVShow: boolean) => {
        return (items || []).map((item) => {
          const baseItem = {
            ...item,
            id: item.id || item._id,
            isTVShow: isTVShow as true | false,
            votes: item.votes || { yes: 0, no: 0 },
            commentCount: item.commentCount || 0,
            genres: item.genres || [],
            createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
            updatedAt: item.updatedAt ? new Date(item.updatedAt) : new Date(),
            // The contractId will be derived when needed
          };

          if (isTVShow) {
            return {
              ...baseItem,
              isTVShow: true as const,
              firstAirDate: item.firstAirDate
            } as const;
          }
          
          return {
            ...baseItem,
            isTVShow: false as const,
            releaseYear: item.releaseYear
          } as const;
        });
      };
      
      // Fetch both movies and TV shows
      const [moviesResponse, tvShowsResponse] = await Promise.all([
        fetch('/api/movies'),
        fetch('/api/tv')
      ]);

      if (moviesResponse.ok && tvShowsResponse.ok) {
        const [moviesData, tvShowsData] = await Promise.all([
          moviesResponse.json(),
          tvShowsResponse.json()
        ]);

        const movies = processMedia(moviesData.movies || [], false) as Movie[];
        const tvShows = processMedia(tvShowsData.tvShows || [], true) as TVShow[];

        // Combine and sort by creation date (newest first)
        const allMedia = [...movies, ...tvShows].sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ) as Array<Movie | TVShow>;

        setMedia(allMedia);
      } else {
        console.error('Failed to fetch media');
      }
    } catch (error) {
      console.error('Error fetching media:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch user's previous votes
  const fetchUserVotes = useCallback(async () => {
    if (!isConnected || !address) return;
    
    try {
      // For now, we'll return empty votes since we're not tracking them in Firestore yet
      const votes: Record<string, 'yes' | 'no'> = {};
      setVotes(votes);
    } catch (error) {
      console.error('Error fetching user votes:', error);
    }
  }, [isConnected, address]);

  // Load data on component mount
  useEffect(() => {
    fetchAllMedia();
    
    // Set up referral tag
    if (typeof window !== 'undefined') {
      const tag = localStorage.getItem('divvi_referral_tag');
      if (tag) setReferralTag(tag);
    }
    
    // Cleanup vote attempt timeouts
    return () => {
      Object.values(voteAttempts).forEach(attempt => {
        if (attempt.timeoutId) {
          clearTimeout(attempt.timeoutId);
        }
      });
    };
  }, [fetchAllMedia, voteAttempts]);

  // Handle voting
  const handleVote = async (id: string, vote: 'yes' | 'no', isTVShow: boolean = false) => {
    if (!isConnected) {
      // Show vote attempt indicator
      setVoteAttempts(prev => ({
        ...prev,
        [id]: { show: true }
      }));
      
      const timeoutId = setTimeout(() => {
        setVoteAttempts(prev => ({
          ...prev,
          [id]: { ...prev[id], show: false }
        }));
      }, 2000);

      setVoteAttempts(prev => ({
        ...prev,
        [id]: { show: true, timeoutId }
      }));

      return;
    }
    
    if (currentChainId !== 42220 && currentChainId !== 44787) {
      alert('Please switch to a Celo network (testnet or mainnet) before voting.');
      return;
    }
    
    setCurrentVotingId(id);
    setTxStatus(prev => ({ ...prev, [id]: 'Submitting vote...' }));

    try {
      if (!hasSufficientCELOForGas(celoBalance)) {
        alert('Insufficient CELO for gas fees. Get some CELO from the faucet to vote.');
        setCurrentVotingId(null);
        setTxStatus(prev => ({ ...prev, [id]: '' }));
        return;
      }

      // Optimistically update the UI
      setMedia(prev => prev.map(item => {
        if (item.id === id) {
          return {
            ...item,
            votes: {
              ...item.votes,
              [vote]: (item.votes[vote] || 0) + 1
            }
          };
        }
        return item;
      }));

      setVotes(prev => ({ ...prev, [id]: vote }));

      // 1. First, submit the blockchain transaction (user will sign)
      setTxStatus(prev => ({ ...prev, [id]: 'Waiting for transaction signature...' }));
      
      // Find the movie to get its details
      const movieItem = media.find(item => item.id === id);
      if (!movieItem) {
        throw new Error(`Movie with ID ${id} not found`);
      }
      
      // Derive the contract ID off-chain based on creation date
      const contractId = getContractIdForMovie(id, media);
      console.log('Derived contract ID:', contractId, 'for movie:', movieItem.title);
      
      if (contractId === -1) {
        throw new Error(
          `Could not determine contract ID for "${movieItem.title}". ` +
          `This movie may not be properly registered in the system.`
        );
      }
      
      const movieIdNum = contractId;
      
      const movieIdBigInt = BigInt(movieIdNum);
      console.log('Converted movie ID to BigInt:', movieIdBigInt.toString());
      
      // Build calldata with Divvi referral tag and send raw transaction
      const calldata = encodeFunctionData({
        abi: VOTE_CONTRACT_ABI,
        functionName: 'vote',
        args: [movieIdBigInt, vote === 'yes']
      });
      
      const dataWithTag = referralTag ? (calldata + referralTag.slice(2)) : calldata;
      if (!walletClient) throw new Error('Wallet client unavailable');
      
      setTxStatus(prev => ({ ...prev, [id]: 'Please sign the transaction...' }));
      
      console.log('Sending transaction to contract:', VOTE_CONTRACT_ADDRESS);
      console.log('Transaction data:', dataWithTag);
      console.log('Movie ID (BigInt):', movieIdBigInt.toString());
      console.log('Vote type:', vote);
      
      const txHash = await walletClient.sendTransaction({
        account: address!,
        to: VOTE_CONTRACT_ADDRESS,
        data: dataWithTag as `0x${string}`,
        value: 0n
      });

      console.log('Transaction hash:', txHash);
      setTxStatus(prev => ({ ...prev, [id]: 'Transaction submitted! Waiting for confirmation...' }));

      // Get the chain ID and wait for receipt to ensure it's confirmed on-chain
      const chainId = await walletClient.getChainId();
      
      // Create a public client to wait for transaction receipt
      const publicClient = createPublicClient({
        chain: celo, // Celo mainnet (chainId 42220) or testnet (44787) both use celo chain config
        transport: http()
      });
      
      setTxStatus(prev => ({ ...prev, [id]: 'Waiting for transaction confirmation...' }));
      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
      console.log('Transaction confirmed:', receipt);
      
      if (receipt.status === 'reverted') {
        throw new Error('Transaction was reverted on-chain');
      }

      setTxStatus(prev => ({ ...prev, [id]: 'Transaction confirmed! Saving to database...' }));

      // Submit referral to Divvi
      submitReferral({ txHash, chainId }).catch((e) => 
        console.error('Divvi submitReferral failed:', e)
      );

      // 2. After successful blockchain transaction, save the vote to Firestore
      const apiEndpoint = isTVShow ? '/api/tv' : '/api/movies';
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'vote',
          id,
          type: vote,
          userAddress: address
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to save vote to database');
      }

      setTxStatus(prev => ({ ...prev, [id]: 'Vote successful!' }));
    } catch (err) {
      console.error('Error in voting process:', err);
      
      // Check if error is from transaction or database
      const isTransactionError = err instanceof Error && (
        err.message.includes('user rejected') ||
        err.message.includes('insufficient') ||
        err.message.includes('execution reverted') ||
        err.message.includes('gas') ||
        err.message.includes('Wallet client')
      );
      
      if (isTransactionError) {
        // Revert optimistic update if transaction failed
        setMedia(prev => prev.map(item => {
          if (item.id === id) {
            return {
              ...item,
              votes: {
                ...item.votes,
                [vote]: Math.max(0, (item.votes[vote] || 0) - 1)
              }
            };
          }
          return item;
        }));
        
        setVotes(prev => ({ ...prev, [id]: null }));
      }
      
      // Provide more specific error messages
      let errorMessage = 'Vote failed';
      if (err instanceof Error) {
        if (err.message?.includes('insufficient funds') || err.message?.includes('insufficient balance')) {
          errorMessage = 'Insufficient CELO for gas fees. Please ensure you have enough CELO to cover transaction costs.';
        } else if (err.message?.includes('user rejected')) {
          errorMessage = 'Transaction was cancelled';
        } else if (err.message?.includes('execution reverted')) {
          errorMessage = 'Smart contract execution failed. This could mean:\n\n1. The movie ID does not exist on the contract\n2. The contract has an error\n3. You have already voted on this movie\n\nPlease check if the movie exists on the contract first.';
        } else if (err.message?.includes('gas')) {
          errorMessage = 'Gas estimation failed. Please try again.';
        } else if (err.message?.includes('Failed to save vote to database')) {
          errorMessage = 'Transaction succeeded but failed to save to database. Your vote was recorded on-chain.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setTxStatus(prev => ({ 
        ...prev, 
        [id]: errorMessage
      }));
    } finally {
      setTimeout(() => {
        setCurrentVotingId(null);
        setTxStatus(prev => ({ ...prev, [id]: '' }));
      }, 3000);
    }
  };

  // Handle back navigation
  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

  // Render loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <Header showSearch={false} />
          <div className="grid grid-cols-1 gap-6 mt-8">
            {[...Array(5)].map((_, i) => (
              <HorizontalMovieCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4">
      {/* Page Header */}
      <Header showSearch={false} />
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Movies & TV Shows</h1>
        </div>
        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 border rounded-lg p-1 bg-background">
            <Button
              variant={viewMode === 'swipe' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('swipe')}
              className="h-8 px-3"
            >
              <Hand className="h-4 w-4 mr-1.5" />
              <span className="hidden sm:inline">Swipe</span>
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="h-8 px-3"
            >
              <LayoutGrid className="h-4 w-4 mr-1.5" />
              <span className="hidden sm:inline">List</span>
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAllMedia}
            disabled={loading}
            className="flex items-center space-x-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Swipeable View */}
      {viewMode === 'swipe' ? (
        <div className="w-full">
          {loading ? (
            <div className="text-center py-16 text-lg font-medium">Loading movies...</div>
          ) : media.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No media found.</p>
            </div>
          ) : (
            <div className="bg-[#18181B] rounded-2xl shadow-lg p-6">
              <div className="mb-4 text-center">
                <h2 className="text-xl font-semibold text-white mb-2">Swipe to Vote</h2>
                <p className="text-white/70 text-sm">
                  Swipe right for Yes, swipe left for No. All votes are saved to Firebase!
                </p>
              </div>
              <SwipeableMovies 
                movies={media.map(item => {
                  // Handle releaseYear - convert Date to string if needed
                  let releaseYear: string | undefined = undefined;
                  if (item.releaseYear) {
                    releaseYear = item.releaseYear instanceof Date 
                      ? item.releaseYear.getFullYear().toString()
                      : typeof item.releaseYear === 'string'
                      ? item.releaseYear
                      : undefined;
                  } else if (item.isTVShow && (item as TVShow).firstAirDate) {
                    const firstAirDate = (item as TVShow).firstAirDate;
                    releaseYear = firstAirDate instanceof Date
                      ? firstAirDate.getFullYear().toString()
                      : typeof firstAirDate === 'string'
                      ? firstAirDate
                      : undefined;
                  }
                  
                  return {
                    id: item.id,
                    _id: item.id,
                    title: item.title,
                    description: item.description || '',
                    releaseYear,
                    posterUrl: item.posterUrl,
                    votes: item.votes || { yes: 0, no: 0 },
                    genres: item.genres || [],
                    rating: item.votes && (item.votes.yes || item.votes.no)
                      ? ((item.votes.yes / (item.votes.yes + item.votes.no)) * 5)
                      : undefined
                  };
                })}
                onMoviesExhausted={() => {
                  console.log('All movies voted on');
                }}
              />
            </div>
          )}
        </div>
      ) : (
        /* List View */
        <div className="space-y-4">
          {loading ? (
            // Skeleton Loaders
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <div className="h-48 bg-muted rounded-t-lg" />
                  <CardContent className="p-4">
                    <div className="h-6 bg-muted rounded w-3/4 mb-2" />
                    <div className="h-4 bg-muted rounded w-1/2 mb-4" />
                    <div className="flex justify-between">
                      <div className="h-8 bg-muted rounded-full w-24" />
                      <div className="h-8 bg-muted rounded-full w-8" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : media.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No media found.</p>
            </div>
          ) : (
            media.map((item) => (
            <Card key={item.id} className="overflow-hidden">
              <div className="md:flex">
                {/* Poster Image */}
                <div className="relative w-full md:w-32 h-48 md:h-auto flex-shrink-0">
                  {item.posterUrl ? (
                    <Image
                      src={ensureFullPosterUrl(item.posterUrl)}
                      alt={item.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 128px"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-muted">
                      {item.isTVShow ? (
                        <Tv className="h-12 w-12 text-muted-foreground" />
                      ) : (
                        <Film className="h-12 w-12 text-muted-foreground" />
                      )}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg font-semibold">
                        {item.title}
                        {item.releaseYear && (
                          <span className="text-muted-foreground ml-2 font-normal">
                            ({new Date(item.releaseYear).getFullYear()})
                          </span>
                        )}
                      </CardTitle>
                      <div className="flex items-center mt-1 text-sm text-muted-foreground">
                        {item.isTVShow && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 mr-2">
                            TV Show
                          </span>
                        )}
                        <div className="flex items-center">
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 mr-1" />
                          <span>{
                            item.votes && (item.votes.yes || item.votes.no) 
                              ? ((item.votes.yes / (item.votes.yes + item.votes.no)) * 5).toFixed(1)
                              : 'N/A'
                          }</span>
                        </div>
                      </div>
                    </div>
                    <div className="h-10 w-10 flex items-center justify-center">
                      <WatchlistButton 
                        movieId={item.id}
                        movieTitle={item.title}
                        size="sm"
                        className="h-9 w-9 p-0 text-muted-foreground hover:text-foreground"
                      />
                    </div>
                  </div>

                  {item.description && (
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                      {item.description}
                    </p>
                  )}

                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex space-x-2">
                      <Button
                        variant={votes[item.id] === 'yes' ? 'default' : 'outline'}
                        size="sm"
                        className="h-8 px-3 text-xs"
                        onClick={() => handleVote(item.id, 'yes', item.isTVShow)}
                        disabled={!!txStatus[item.id] || currentVotingId === item.id}
                      >
                        <ThumbsUpIcon className="h-3.5 w-3.5 mr-1.5" />
                        {item.votes?.yes || 0}
                      </Button>
                      <Button
                        variant={votes[item.id] === 'no' ? 'destructive' : 'outline'}
                        size="sm"
                        className="h-8 px-3 text-xs"
                        onClick={() => handleVote(item.id, 'no', item.isTVShow)}
                        disabled={!!txStatus[item.id] || currentVotingId === item.id}
                      >
                        <ThumbsDownIcon className="h-3.5 w-3.5 mr-1.5" />
                        {item.votes?.no || 0}
                      </Button>
                      <Link 
                        href={`/media/${item.isTVShow ? 'tv' : 'movie'}/${item.id}` as any}
                        className="flex items-center h-8 px-3 text-xs text-muted-foreground hover:text-foreground"
                      >
                        <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
                        {item.commentCount || 0}
                      </Link>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-primary"
                      onClick={() => {
                        const path = `/media/${item.isTVShow ? 'tv' : 'movie'}/${item.id}` as const;
                        router.push(path as any);
                      }}
                    >
                      View Details
                    </Button>
                  </div>

                  {txStatus[item.id] && (
                    <p className="mt-2 text-xs text-muted-foreground text-right">
                      {txStatus[item.id]}
                    </p>
                  )}
                </div>
              </div>
            </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
