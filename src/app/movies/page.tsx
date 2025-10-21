"use client";
import { useState, useEffect } from "react";
import WatchlistButton from "~/components/WatchlistButton";
import Link from "next/link";
import { Card, CardContent, CardTitle, CardDescription } from "~/components/ui/card";
import { Button } from "~/components/ui/Button";
import Image from "next/image";
import { VOTE_CONTRACT_ADDRESS, VOTE_CONTRACT_ABI } from "~/constants/voteContract";
import { useAccount, useChainId, useSwitchChain, useWriteContract, useBalance, useReadContract, useWalletClient } from "wagmi";
import { encodeFunctionData } from "viem";
import { getDataSuffix, submitReferral } from "@divvi/referral-sdk";
import { useRouter } from "next/navigation";
import Header from "~/components/Header";
import { ArrowLeft, RefreshCw, Film, Tv, MessageSquare } from "lucide-react";
import { formatCELOBalance, hasSufficientCELOForGas, ensureFullPosterUrl } from "~/lib/utils";
import { ThumbsDownIcon, ThumbsUpIcon } from "~/components/icons";
import { HorizontalMovieCardSkeleton } from "~/components/MovieCardSkeleton";

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
  
  const { 
    data: hash, 
    isPending,
    writeContract,
    error
  } = useWriteContract();
  
  const { data: celoBalance } = useBalance({
    address,
    chainId: 42220,
  });

  // Auto-switch to Celo when wallet connects
  const [isSwitchingNetwork, setIsSwitchingNetwork] = useState(false);
  
  useEffect(() => {
    if (isConnected && currentChainId !== 42220 && currentChainId !== 44787) {
      setIsSwitchingNetwork(true);
      switchChainAsync({ chainId: 42220 })
        .then(() => {
          setIsSwitchingNetwork(false);
        })
        .catch((err) => {
          console.error('Failed to switch to Celo mainnet, trying testnet:', err);
          return switchChainAsync({ chainId: 44787 });
        })
        .then(() => {
          setIsSwitchingNetwork(false);
        })
        .catch((err) => {
          console.error('Failed to switch to Celo:', err);
          setIsSwitchingNetwork(false);
        });
    }
  }, [isConnected, currentChainId, switchChainAsync]);

  // Prepare Divvi referral tag
  useEffect(() => {
    if (isConnected && address) {
      try {
        const tag = getDataSuffix({ consumer: '0xc49b8e093600f684b69ed6ba1e36b7dfad42f982' });
        setReferralTag(tag);
      } catch (e) {
        console.error('Failed to create Divvi referral tag:', e);
        setReferralTag(null);
      }
    } else {
      setReferralTag(null);
    }
  }, [isConnected, address]);

  const fetchAllMedia = async () => {
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

        const movies = (moviesData.movies || []).map((m: Media) => ({ ...m, isTVShow: false }));
        const tvShows = (tvShowsData.tvShows || []).map((t: Media) => ({ ...t, isTVShow: true }));

        // Combine and sort by creation date
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
  };

  // Fetch user's previous votes
  const fetchUserVotes = async () => {
    if (!isConnected || !address) return;
    
    try {
      const [moviesVotes, tvVotes] = await Promise.all([
        fetch('/api/movies', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'getUserVotes',
            userAddress: address
          })
        }),
        fetch('/api/tv', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'getUserVotes',
            userAddress: address
          })
        })
      ]);
      
      if (moviesVotes.ok && tvVotes.ok) {
        const [moviesData, tvData] = await Promise.all([
          moviesVotes.json(),
          tvVotes.json()
        ]);
        
        setVotes({
          ...moviesData.userVotes || {},
          ...tvData.userVotes || {}
        });
      }
    } catch (error) {
      console.error('Error fetching user votes:', error);
    }
  };

  useEffect(() => {
    fetchAllMedia();
  }, []);

  // Fetch user votes when wallet connects
  useEffect(() => {
    if (isConnected && address) {
      fetchUserVotes();
    }
  }, [isConnected, address]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(voteAttempts).forEach(attempt => {
        if (attempt.timeoutId) {
          clearTimeout(attempt.timeoutId);
        }
      });
    };
  }, [voteAttempts]);

  const handleVote = async (id: string, vote: 'yes' | 'no', isTVShow: boolean) => {
    if (votes[id]) {
      if (voteAttempts[id]?.timeoutId) {
        clearTimeout(voteAttempts[id].timeoutId);
      }
      
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

      const voteValue = vote === 'yes';
      const args: [bigint, boolean] = [BigInt(id), voteValue];

      writeContract({
        address: VOTE_CONTRACT_ADDRESS,
        abi: VOTE_CONTRACT_ABI,
        functionName: 'vote',
        args
      });

      // Save vote to database
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

      if (response.ok) {
        setVotes(prev => ({ ...prev, [id]: vote }));
        
        // Update vote count in UI
        setMedia(prev => prev.map(item => {
          if (item.id === id) {
            return {
              ...item,
              votes: {
                ...item.votes,
                [vote]: item.votes[vote] + 1
              }
            };
          }
          return item;
        }));

        setTxStatus(prev => ({ ...prev, [id]: 'Vote successful!' }));
      } else {
        throw new Error('Failed to save vote');
      }
    } catch (err) {
      console.error('Error voting:', err);
      setTxStatus(prev => ({ ...prev, [id]: 'Vote failed' }));
    } finally {
      setTimeout(() => {
        setCurrentVotingId(null);
        setTxStatus(prev => ({ ...prev, [id]: '' }));
      }, 3000);
    }
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  };

  return (
    <main className="min-h-screen">
      <div className="max-w-2xl mx-auto px-4 pb-20">
        <Header showSearch={false} />
        
        {/* Page Header */}
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleBack}
            className="mr-3 p-2"
          >
            <ArrowLeft size={18} />
          </Button>
          <h1 className="text-xl font-semibold text-foreground">Rate Movies</h1>
        </div>

        {/* Content */}
        {loading ? (
          <div className="grid gap-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <Card key={index} className="overflow-hidden bg-card">
                <CardContent className="p-0">
                  <HorizontalMovieCardSkeleton />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : media.length === 0 ? (
          <div className="text-center py-20">
            <Film className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No movies or TV shows available.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {media.map((item) => (
              <Card key={item.id} className="overflow-hidden bg-card">
                <CardContent className="p-0">
                  <div className="flex">
                    {/* Poster */}
                    <Link href={`/movies/${item.id}`} className="relative w-[120px] h-[180px] flex-shrink-0">
                      <Image
                        src={ensureFullPosterUrl(item.posterUrl)}
                        alt={item.title}
                        fill
                        sizes="120px"
                        className="object-cover"
                        priority
                      />
                    </Link>

                    {/* Content */}
                    <div className="flex-1 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <Link 
                            href={`/movies/${item.id}`}
                            className="hover:underline"
                          >
                            <CardTitle className="text-base mb-1 line-clamp-1">
                              {item.title}
                              {item.releaseYear ? ` (${item.releaseYear})` : ''}
                            </CardTitle>
                          </Link>
                          <CardDescription className="line-clamp-2 mb-2">
                            {item.description}
                          </CardDescription>
                          {/* Comments count */}
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <MessageSquare size={14} />
                            <span>{item.commentCount ?? 0} comments</span>
                          </div>
                        </div>
                        <WatchlistButton movieId={item.id} />
                      </div>

                      {/* Vote buttons */}
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <Button
                              onClick={() => handleVote(item.id, 'yes', item.isTVShow || false)}
                              disabled={!!votes[item.id] || currentVotingId === item.id}
                              className={`px-3 py-1 h-9 gap-2 font-semibold border bg-background hover:bg-accent ${
                                votes[item.id] === 'yes' ? 'ring-1 ring-border' : ''
                              }`}
                            >
                              <ThumbsUpIcon size={16} />
                              <span>Yes</span>
                            </Button>
                            <span className="text-sm font-semibold text-foreground">{item.votes.yes}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              onClick={() => handleVote(item.id, 'no', item.isTVShow || false)}
                              disabled={!!votes[item.id] || currentVotingId === item.id}
                              className={`px-3 py-1 h-9 gap-2 font-semibold border bg-background hover:bg-accent ${
                                votes[item.id] === 'no' ? 'ring-1 ring-border' : ''
                              }`}
                            >
                              <ThumbsDownIcon size={16} />
                              <span>No</span>
                            </Button>
                            <span className="text-sm font-semibold text-foreground">{item.votes.no}</span>
                          </div>
                        </div>

                        {/* Vote status */}
                        <div className="flex items-center">
                          {txStatus[item.id] && (
                            <span className="text-xs text-muted-foreground">
                              {txStatus[item.id]}
                              {currentVotingId === item.id && (
                                <RefreshCw className="inline-block w-3 h-3 ml-1 animate-spin" />
                              )}
                            </span>
                          )}
                          {voteAttempts[item.id]?.show && (
                            <span className="text-xs text-yellow-400">
                              You've already voted!
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}