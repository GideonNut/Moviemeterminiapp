"use client";
import { useState, useEffect } from "react";
import { use } from "react";
import { Card, CardContent, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/Button";
import Image from "next/image";
import Link from "next/link";
import Header from "~/components/Header";
import { useRouter } from "next/navigation";
import { ArrowLeft, Calendar, Clock,  Star, Play, RefreshCw } from "lucide-react";
import { useAccount, useChainId, useSwitchChain, useWriteContract, useBalance, useWalletClient } from "wagmi";
import { VOTE_CONTRACT_ADDRESS, VOTE_CONTRACT_ABI } from "~/constants/voteContract";
import { formatCELOBalance, hasSufficientCELOForGas, ensureFullPosterUrl } from "~/lib/utils";
import WatchlistButton from "~/components/WatchlistButton";
import CommentsSection from "~/components/CommentsSection";
import { encodeFunctionData } from "viem";
import { getDataSuffix, submitReferral } from "@divvi/referral-sdk";
import { ThumbsDownIcon, ThumbsUpIcon } from "~/components/icons";

interface Movie {
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
  createdAt: string;
  updatedAt: string;
}

export default function MovieDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);
  const [votes, setVotes] = useState<{ [id: string]: 'yes' | 'no' | null }>({});
  const [txStatus, setTxStatus] = useState<{ [id: string]: string }>({});
  const [currentVotingId, setCurrentVotingId] = useState<string | null>(null);
  const [relatedMovies, setRelatedMovies] = useState<Movie[]>([]);
  const [referralTag, setReferralTag] = useState<string | null>(null);

  const { address, isConnected } = useAccount();
  const currentChainId = useChainId();
  const { switchChainAsync } = useSwitchChain();
  const { data: walletClient } = useWalletClient();
  
  // Use the proper Wagmi hook for smart contract interactions
  const { 
    data: hash, 
    isPending,
    writeContract,
    error
  } = useWriteContract();

  // Get CELO balance for gas fees
  const { data: celoBalance } = useBalance({
    address,
    chainId: 42220,
  });

  // Auto-switch to Celo when wallet connects
  const [isSwitchingNetwork, setIsSwitchingNetwork] = useState(false);
  
  useEffect(() => {
    if (isConnected && currentChainId !== 42220 && currentChainId !== 44787) {
      setIsSwitchingNetwork(true);
      // Try mainnet first for production use
      switchChainAsync({ chainId: 42220 })
        .then(() => {
          setIsSwitchingNetwork(false);
        })
        .catch((err) => {
          console.error('Failed to switch to Celo mainnet, trying testnet:', err);
          // Fallback to testnet if mainnet fails
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

  const fetchMovie = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/movies');
      if (response.ok) {
        const data = await response.json();
        const foundMovie = data.movies?.find((m: Movie) => m.id === id);
        setMovie(foundMovie || null);
        
        // Get related movies (same genre or random)
        if (foundMovie) {
          const related = data.movies
            ?.filter((m: Movie) => m.id !== id)
            .slice(0, 4) || [];
          setRelatedMovies(related);
        }
      }
    } catch (error) {
      console.error('Error fetching movie:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch user's previous votes from MongoDB
  const fetchUserVotes = async () => {
    if (!isConnected || !address) return;
    
    try {
      const response = await fetch('/api/movies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'getUserVotes',
          userAddress: address
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setVotes(data.userVotes || {});
      }
    } catch (error) {
      console.error('Error fetching user votes:', error);
    }
  };

  useEffect(() => {
    fetchMovie();
  }, [id]);

  // Fetch user votes when wallet connects
  useEffect(() => {
    if (isConnected && address) {
      fetchUserVotes();
    }
  }, [isConnected, address]);

  const handleVote = async (movieId: string, vote: 'yes' | 'no') => {
    if (votes[movieId]) return;
    
    // Check if we're on a Celo network
    if (currentChainId !== 42220 && currentChainId !== 44787) {
      alert('Please switch to a Celo network (testnet or mainnet) before voting. Use the "Switch to Celo" button above.');
      return;
    }
    
    setCurrentVotingId(movieId);
    setTxStatus((prev) => ({ ...prev, [movieId]: 'pending' }));
    
    try {
      if (!isConnected || !address) throw new Error("Wallet not connected");

      const movieIdBigInt = BigInt(parseInt(movieId, 10));

      // Set the vote immediately to prevent double-clicking
      setVotes((prev) => ({ ...prev, [movieId]: vote }));

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
      submitReferral({ txHash, chainId }).catch((e) => console.error('Divvi submitReferral failed:', e));

      // Persist vote to MongoDB
      fetch('/api/movies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'vote',
          id: movieId,
          type: vote,
          userAddress: address
        })
      }).catch(error => {
        console.error('Failed to save vote to MongoDB:', error);
      });
      
    } catch (err: any) {
      console.error('Vote error:', err);
      
      // Revert the vote if there was an error
      setVotes((prev) => ({ ...prev, [movieId]: null }));
      
      // Provide more specific error messages
      let errorMessage = 'Transaction failed';
      if (err.message?.includes('insufficient funds') || err.message?.includes('insufficient balance')) {
        errorMessage = 'Insufficient CELO for gas fees. Please ensure you have enough CELO to cover transaction costs.';
      } else if (err.message?.includes('user rejected')) {
        errorMessage = 'Transaction was cancelled';
      } else if (err.message?.includes('execution reverted')) {
        errorMessage = 'Smart contract execution failed. This could mean:\n\n1. The movie ID does not exist on the contract\n2. The contract has an error\n3. You have already voted on this movie\n\nPlease check if the movie exists on the contract first.';
      } else if (err.message?.includes('gas')) {
        errorMessage = 'Gas estimation failed. Please try again.';
      }
      
      setTxStatus((prev) => ({ ...prev, [movieId]: 'error' }));
      setCurrentVotingId(null);
      
      // Show error to user (you can add a toast notification here)
      alert(errorMessage);
    }
  };

  // Handle transaction state changes
  useEffect(() => {
    if (hash && currentVotingId) {
      // Transaction was sent successfully
      console.log('Transaction hash:', hash);
      
      // Update the transaction status to success
      setTxStatus((prev) => ({ ...prev, [currentVotingId]: 'success' }));
      
      // Save vote to MongoDB
      if (address && votes[currentVotingId]) {
        fetch('/api/movies', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'vote',
            id: currentVotingId,
            type: votes[currentVotingId],
            userAddress: address
          })
        }).then(response => {
          if (!response.ok) {
            return response.json().then(errorData => {
              throw new Error(errorData.error || 'Failed to save vote');
            });
          }
        }).catch(error => {
          console.error('Failed to save vote to MongoDB:', error);
          // Use the error handling function
          handleVoteSaveError(currentVotingId, votes[currentVotingId]!);
        });
      }
      
      // Clear the current voting ID
      setCurrentVotingId(null);
      
      // Refresh movie to get updated vote counts
      setTimeout(() => fetchMovie(), 1000);
    }
  }, [hash, currentVotingId, address, votes]);

  // Handle errors from the contract
  useEffect(() => {
    if (error && currentVotingId) {
      console.error('Contract error:', error);
      
      // Revert the vote if the contract call failed
      setVotes((prev) => ({ ...prev, [currentVotingId]: null }));
      
      // Provide specific error messages based on the error
      let errorMessage = 'Transaction failed';
      if (error.message?.includes('insufficient funds') || error.message?.includes('insufficient balance')) {
        errorMessage = 'Insufficient CELO for gas fees. Please ensure you have enough CELO to cover transaction costs.';
      } else if (error.message?.includes('user rejected')) {
        errorMessage = 'Transaction was cancelled';
      } else if (error.message?.includes('execution reverted')) {
        errorMessage = 'Smart contract execution failed. This could mean:\n\n1. The movie ID does not exist on the contract\n2. The contract has an error\n3. You have already voted on this movie\n\nPlease check if the movie exists on the contract first.';
      } else if (error.message?.includes('gas')) {
        errorMessage = 'Gas estimation failed. Please try again.';
      }
      
      // Update the status for the specific movie being voted on
      setTxStatus((prev) => ({ ...prev, [currentVotingId]: 'error' }));
      
      // Clear the current voting ID
      setCurrentVotingId(null);
      
      alert(errorMessage);
    }
  }, [error, currentVotingId]);

  // Handle MongoDB vote save errors
  const handleVoteSaveError = async (movieId: string, vote: 'yes' | 'no') => {
    try {
      const response = await fetch('/api/movies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'vote',
          id: movieId,
          type: vote,
          userAddress: address
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.error?.includes('already voted')) {
          // User already voted, show specific message
          alert('You have already voted on this movie. Each user can only vote once per movie.');
          // Refresh user votes to show current state
          fetchUserVotes();
        } else {
          throw new Error(errorData.error || 'Failed to save vote');
        }
      }
    } catch (error) {
      console.error('Failed to save vote to MongoDB:', error);
      alert('Failed to save your vote. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] pb-20">
        <div className="max-w-4xl mx-auto px-4 pt-5">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-white/60" />
              <p className="text-white/60">Loading movie details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] pb-20">
        <div className="max-w-4xl mx-auto px-4 pt-5">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-white mb-4">Movie Not Found</h1>
            <p className="text-white/60 mb-6">The movie you're looking for doesn't exist.</p>
                            <Link href="/movies">
              <Button variant="outline">← Back to Movies</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const totalVotes = movie.votes.yes + movie.votes.no;
  const yesPercentage = totalVotes > 0 ? (movie.votes.yes / totalVotes) * 100 : 0;
  const noPercentage = totalVotes > 0 ? (movie.votes.no / totalVotes) * 100 : 0;

  return (
    <div className="min-h-screen bg-[#0A0A0A] pb-20">
      <div className="max-w-4xl mx-auto px-4 pt-5">

        <Header showSearch={true} />
        {/* Back Button */}
         <div className="flex items-center mt-10 mb-6">
               <Button 
                 variant="ghost" 
                 size="sm"
                 onClick={() => router.back()} 
                 className="mr-3 p-2 bg-white hover:bg-white/10"
               >
                 <ArrowLeft size={18} />
               </Button>
               <h1 className="text-xl font-semibold text-white">Back to Movies</h1>
             </div>

        {/* Balance and Gas Status */}
        {isConnected && (
          <div className="mb-6 p-4 rounded-lg border border-white/10 bg-[#18181B]">
            {/* Network Status */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-white/60 text-sm">Network:</span>
                <span className={`text-sm font-medium px-2 py-1 rounded ${
                  currentChainId === 42220 
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                    : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                }`}>
                  {currentChainId === 42220 ? 'Celo Mainnet' : 
                   currentChainId === 44787 ? 'Celo Alfajores (Testnet)' :
                   isSwitchingNetwork ? 'Switching to Celo...' : 'Other Network'}
                </span>
              </div>
            </div>

            {/* CELO Balance - Only show if on Celo network */}
            {currentChainId === 42220 && celoBalance && (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-white/60 text-sm">CELO Balance:</span>
                    <span className="text-white font-medium">{formatCELOBalance(celoBalance.value)} CELO</span>
                  </div>
                  {!hasSufficientCELOForGas(celoBalance.value) && (
                    <div className="flex items-center gap-2 text-yellow-400 text-sm">
                      <span>Low balance for gas fees</span>
                    </div>
                  )}
                </div>
                <p className="text-white/40 text-xs mt-2">
                  Gas fees on Celo are typically 0.001-0.01 CELO per transaction
                </p>
                {!hasSufficientCELOForGas(celoBalance.value) && (
                  <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-md">
                    <p className="text-yellow-400 text-xs">
                      ⚠️ You need at least 0.01 CELO to vote. Please add more CELO to your wallet for gas fees.
                    </p>
                  </div>
                )}
              </>
            )}

            {/* Warning if not on Celo */}
            {currentChainId !== 42220 && (
              <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-md">
                <p className="text-yellow-400 text-xs">
                  ⚠️ Automatically switching to Celo network... Please wait a moment before voting.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {/* Movie Poster */}
          <div className="md:col-span-1">
            <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-neutral-900 sticky top-8">
              {movie.posterUrl ? (
                <Image
                  src={ensureFullPosterUrl(movie.posterUrl) || ''}
                  alt={movie.title}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-white/40">
                  <div className="text-center">
                    <Play size={48} className="mx-auto mb-2" />
                    <span>No Poster Available</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Movie Details */}
          <div className="md:col-span-2">
            {/* Title and Meta */}
            <div className="mb-6">
              {/* Title and Watchlist Button Row */}
              <div className="flex items-start justify-between mb-4">
                <h1 className="text-3xl md:text-4xl font-bold text-white flex-1">{movie.title}</h1>
                <WatchlistButton movieId={movie.id} movieTitle={movie.title} size="default" className="ml-4 flex-shrink-0" showText={true} />
              </div>
              
              {/* Meta Info */}
              <div className="flex flex-wrap items-center gap-4 text-white/60 mb-4">
                <div className="flex items-center gap-2">
                  <Calendar size={16} />
                  <span>{movie.releaseYear || 'Unknown Year'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={16} />
                  <span>Movie</span>
                </div>
                {movie.genres && movie.genres.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Star size={16} />
                    <span>{movie.genres.join(', ')}</span>
                  </div>
                )}
              </div>

              {/* Vote Stats */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <Card className="bg-[#18181B] border-white/10">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-green-400 mb-1">{movie.votes.yes}</div>
                    <div className="text-xs text-white/60">Yes Votes</div>
                    <div className="text-xs text-green-400">{yesPercentage.toFixed(1)}%</div>
                  </CardContent>
                </Card>
                <Card className="bg-[#18181B] border-white/10">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-red-400 mb-1">{movie.votes.no}</div>
                    <div className="text-xs text-white/60">No Votes</div>
                    <div className="text-xs text-red-400">{noPercentage.toFixed(1)}%</div>
                  </CardContent>
                </Card>
                <Card className="bg-[#18181B] border-white/10">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-purple-400 mb-1">{totalVotes}</div>
                    <div className="text-xs text-white/60">Total Votes</div>
                  </CardContent>
                </Card>
              </div>

              {/* Vote Progress Bars */}
              <div className="space-y-3 mb-6">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-green-400">Yes ({movie.votes.yes})</span>
                    <span className="text-green-400">{yesPercentage.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div 
                      className="bg-green-400 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${yesPercentage}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-red-400">No ({movie.votes.no})</span>
                    <span className="text-red-400">{noPercentage.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div 
                      className="bg-red-400 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${noPercentage}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-3">Description</h2>
              <p className="text-white/80 leading-relaxed">{movie.description}</p>
            </div>

            {/* Voting Section */}
            {isConnected ? (
              <Card className="bg-[#18181B] border-white/10 mb-8">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Cast Your Vote</h3>
                  {votes[movie.id] ? (
                    <div className="text-center py-4">
                      <div className="text-green-400 mb-2">You voted: {votes[movie.id]?.toUpperCase()}</div>
                      <p className="text-white/60 text-sm">Thank you for participating!</p>
                    </div>
                  ) : (
                    <div className="flex gap-4">
                      <Button
                        onClick={() => handleVote(movie.id, 'yes')}
                        disabled={isPending || currentVotingId === movie.id}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white border-0"
                        size="lg"
                      >
                        <ThumbsUpIcon size={20} className="mr-2" />
                        {isPending && currentVotingId === movie.id ? 'Processing...' : 'Yes'}
                      </Button>
                      <Button
                        onClick={() => handleVote(movie.id, 'no')}
                        disabled={isPending || currentVotingId === movie.id}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white border-0"
                        size="lg"
                      >
                        <ThumbsDownIcon size={20} className="mr-2" />
                        {isPending && currentVotingId === movie.id ? 'Processing...' : 'No'}
                      </Button>
                    </div>
                  )}
                  
                  {/* Transaction Status */}
                  {txStatus[movie.id] === 'pending' && (
                    <div className="mt-4 text-center">
                      <span className="text-yellow-400 text-sm">Transaction pending...</span>
                    </div>
                  )}
                  {txStatus[movie.id] === 'success' && (
                    <div className="mt-4 text-center">
                      <span className="text-green-400 text-sm">Vote recorded successfully!</span>
                    </div>
                  )}
                  {txStatus[movie.id] === 'error' && (
                    <div className="mt-4 text-center">
                      <span className="text-red-400 text-sm">✗ Transaction failed</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
                <></>
            //   <Card className="bg-[#18181B] border-white/10 mb-8">
            //     <CardContent className="p-6 text-center">
            //       <h3 className="text-lg font-semibold text-white mb-2">Connect to Vote</h3>
            //       <p className="text-white/60 mb-4">Connect your wallet to vote on this movie</p>
            //       <Button className="bg-purple-600 hover:bg-purple-700">
            //         Connect Wallet
            //       </Button>
            //     </CardContent>
            //   </Card>
            )}
          </div>
        </div>

        {/* Comments Section */}
        <div className="mt-5">
          <CommentsSection movieId={movie.id} />
        </div>

        {/* Related Movies */}
        {relatedMovies.length > 0 && (
          <div className="mt-5">
            <h2 className="text-2xl font-bold text-white mb-6">More Movies to Vote On</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {relatedMovies.map((relatedMovie) => (
                <Link key={relatedMovie.id} href={`/movies/${relatedMovie.id}`} className="group">
                  <Card className="bg-[#18181B] border-white/10 overflow-hidden hover:border-white/30 transition-colors">
                    <CardContent className="p-0">
                      <div className="relative aspect-[2/3] bg-neutral-900">
                        {relatedMovie.posterUrl ? (
                          <Image
                            src={ensureFullPosterUrl(relatedMovie.posterUrl) || ''}
                            alt={relatedMovie.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full text-white/40">
                            <Play size={32} />
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        <CardTitle className="text-sm font-medium text-white mb-1 line-clamp-1 group-hover:text-purple-400 transition-colors">
                          {relatedMovie.title}
                        </CardTitle>
                        <p className="text-xs text-white/60 line-clamp-2">
                          {relatedMovie.description.substring(0, 80)}...
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}