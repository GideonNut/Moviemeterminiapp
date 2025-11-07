"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAccount, useChainId, useSwitchChain, useBalance, useWalletClient } from "wagmi";
import { encodeFunctionData } from "viem";
import { getDataSuffix, submitReferral } from "@divvi/referral-sdk";
import { ArrowLeft, RefreshCw, Film, Tv, MessageSquare } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

// Components
import WatchlistButton from "~/components/WatchlistButton";
import { Card, CardContent, CardTitle, CardDescription } from "~/components/ui/card";
import { Button } from "~/components/ui/Button";
import Header from "~/components/Header";
import { ThumbsDownIcon, ThumbsUpIcon } from "~/components/icons";
import { HorizontalMovieCardSkeleton } from "~/components/MovieCardSkeleton";

// Utils
import { VOTE_CONTRACT_ADDRESS, VOTE_CONTRACT_ABI } from "~/constants/voteContract";
import { formatCELOBalance, hasSufficientCELOForGas, ensureFullPosterUrl } from "~/lib/utils";
import { saveMovie, getMovie, getAllMovies } from "~/lib/firestore";

interface Media {
  id: string;
  title: string;
  description: string;
  posterUrl?: string;
  releaseYear?: string;
  genres?: string[];
  votes: {
    yes: number;
    no: number;
  };
  commentCount?: number;
  createdAt: string;
  updatedAt: string;
  isTVShow?: boolean;
}

export default function MediaPage() {
  const router = useRouter();
  const [media, setMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [votes, setVotes] = useState<{ [id: string]: 'yes' | 'no' | null }>({});
  const [txStatus, setTxStatus] = useState<{ [id: string]: string }>({});
  const [currentVotingId, setCurrentVotingId] = useState<string | null>(null);
  const [referralTag, setReferralTag] = useState<string | null>(null);
  const [voteAttempts, setVoteAttempts] = useState<{ [id: string]: { show: boolean; timeoutId?: NodeJS.Timeout } }>({});

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

        const movies = (moviesData.movies || []).map((m: any) => ({
          ...m,
          id: m.id || m._id,
          isTVShow: false,
          votes: m.votes || { yes: 0, no: 0 }
        }));
        
        const tvShows = (tvShowsData.tvShows || []).map((t: any) => ({
          ...t,
          id: t.id || t._id,
          isTVShow: true,
          votes: t.votes || { yes: 0, no: 0 }
        }));

        // Combine and sort by creation date (newest first)
        const allMedia = [...movies, ...tvShows].sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

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
  const handleVote = async (id: string, vote: 'yes' | 'no', isTVShow = false) => {
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

      // 1. First, save the vote to Firestore
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
        throw new Error('Failed to save vote to database');
      }

      // 2. After successful database update, submit the blockchain transaction
      try {
        const movieIdBigInt = BigInt(parseInt(id, 10));
        
        // Build calldata with Divvi referral tag and send raw transaction
        const calldata = encodeFunctionData({
          abi: VOTE_CONTRACT_ABI,
          functionName: 'vote',
          args: [movieIdBigInt, vote === 'yes']
        });
        
        const dataWithTag = referralTag ? (calldata + referralTag.slice(2)) : calldata;
        if (!walletClient) throw new Error('Wallet client unavailable');
        
        const txHash = await walletClient.sendTransaction({
          account: address!,
          to: VOTE_CONTRACT_ADDRESS,
          data: dataWithTag as `0x${string}`,
          value: 0n
        });

        // Submit referral to Divvi
        const chainId = await walletClient.getChainId();
        submitReferral({ txHash, chainId }).catch((e) => 
          console.error('Divvi submitReferral failed:', e)
        );

        setTxStatus(prev => ({ ...prev, [id]: 'Vote successful!' }));
      } catch (blockchainError) {
        console.error('Blockchain transaction failed:', blockchainError);
        // Even if blockchain fails, we keep the UI in sync with Firestore
        setTxStatus(prev => ({ 
          ...prev, 
          [id]: 'Vote recorded! (Blockchain transaction may have failed)' 
        }));
      }
    } catch (err) {
      console.error('Error in voting process:', err);
      
      // Revert optimistic update on error
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
      
      setTxStatus(prev => ({ 
        ...prev, 
        [id]: err instanceof Error ? err.message : 'Vote failed' 
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

  // Skeleton loader component
  const SkeletonMediaCard = () => (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="md:flex animate-pulse">
          {/* Skeleton Poster */}
          <div className="md:w-1/4 lg:w-1/5 relative h-64 md:h-48 bg-gray-200">
            <div className="w-full h-full bg-gray-300" />
          </div>
          
          {/* Skeleton Content */}
          <div className="p-6 flex-1">
            <div className="space-y-4">
              <div className="h-6 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="flex space-x-2">
                <div className="h-6 w-20 bg-gray-200 rounded"></div>
                <div className="h-6 w-20 bg-gray-200 rounded"></div>
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded w-full"></div>
                <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                <div className="h-3 bg-gray-200 rounded w-4/6"></div>
              </div>
              <div className="flex justify-between items-center pt-2">
                <div className="flex space-x-2">
                  <div className="h-9 w-20 bg-gray-200 rounded"></div>
                  <div className="h-9 w-20 bg-gray-200 rounded"></div>
                </div>
                <div className="h-9 w-24 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <Header showSearch={false} />
        
        {/* Page Header */}
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleBack}
            className="mr-3 p-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold">All Movies & TV Shows</h1>
          <Button 
            variant="outline" 
            size="sm" 
            className="ml-auto"
            onClick={fetchAllMedia}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Media List */}
        {loading ? (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <SkeletonMediaCard key={`skeleton-${i}`} />
            ))}
          </div>
        ) : media.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No media found. Try refreshing the page.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {media.map((item) => (
              <Card key={item.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="md:flex">
                    {/* Poster */}
                    <div className="md:w-1/4 lg:w-1/5 relative h-64 md:h-auto">
                      {item.posterUrl ? (
                        <Image
                          src={ensureFullPosterUrl(item.posterUrl)}
                          alt={item.title}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, 25vw"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                          {item.isTVShow ? (
                            <Tv className="w-12 h-12 text-gray-400" />
                          ) : (
                            <Film className="w-12 h-12 text-gray-400" />
                          )}
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-6 flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-xl font-bold">
                            {item.title}
                            {item.releaseYear && (
                              <span className="text-gray-500 font-normal ml-2">
                                ({item.releaseYear})
                              </span>
                            )}
                            {item.isTVShow && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 ml-2">
                                TV Show
                              </span>
                            )}
                          </CardTitle>
                          
                          {item.genres && item.genres.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {item.genres.slice(0, 3).map((genre) => (
                                <span 
                                  key={genre} 
                                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                                >
                                  {genre}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <WatchlistButton 
                          movieId={item.id}
                          movieTitle={item.title}
                          size="sm"
                          className="ml-2"
                        />
                      </div>

                      <CardDescription className="mt-3 line-clamp-3">
                        {item.description || 'No description available.'}
                      </CardDescription>

                      <div className="mt-4 flex items-center justify-between">
                        {/* Vote Buttons */}
                        <div className="flex space-x-2">
                          <Button
                            variant={votes[item.id] === 'yes' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => handleVote(item.id, 'yes', item.isTVShow)}
                            disabled={!!currentVotingId}
                            className="flex items-center"
                          >
                            <ThumbsUpIcon className="w-4 h-4 mr-1" />
                            {item.votes?.yes || 0}
                          </Button>
                          <Button
                            variant={votes[item.id] === 'no' ? 'destructive' : 'outline'}
                            size="sm"
                            onClick={() => handleVote(item.id, 'no', item.isTVShow)}
                            disabled={!!currentVotingId}
                            className="flex items-center"
                          >
                            <ThumbsDownIcon className="w-4 h-4 mr-1" />
                            {item.votes?.no || 0}
                          </Button>
                          {txStatus[item.id] && (
                            <span className="text-sm text-gray-500 ml-2 flex items-center">
                              {txStatus[item.id]}
                            </span>
                          )}
                        </div>

                        {/* Comments */}
                        <Link 
                          href={{
                            pathname: `/media/${item.isTVShow ? 'tv' : 'movie'}/[id]`,
                            query: { id: item.id }
                          }}
                          as={`/media/${item.isTVShow ? 'tv' : 'movie'}/${item.id}`}
                          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
                        >
                          <MessageSquare className="w-4 h-4 mr-1" />
                          {item.commentCount || 0} comments
                        </Link>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
