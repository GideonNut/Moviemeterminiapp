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
import { ArrowLeft, ThumbsUp, ThumbsDown, RefreshCw } from "lucide-react";
import { formatCELOBalance, hasSufficientCELOForGas, ensureFullPosterUrl } from "~/lib/utils";

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

export default function MoviesPage() {
  const router = useRouter();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [votes, setVotes] = useState<{ [id: string]: 'yes' | 'no' | null }>({});
  const [txStatus, setTxStatus] = useState<{ [id: string]: string }>({});
  const [currentVotingId, setCurrentVotingId] = useState<string | null>(null);
  const [referralTag, setReferralTag] = useState<string | null>(null);
  // Removed showMoviesWithoutPosters state since filter UI was removed

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

  const fetchMovies = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/movies');
      if (response.ok) {
        const data = await response.json();
        setMovies(data.movies || []);
        console.log('Fetched movies:', data.movies || []);
      } else {
        console.error('Failed to fetch movies');
      }
    } catch (error) {
      console.error('Error fetching movies:', error);
    } finally {
      setLoading(false);
    }
  };

  // Show all movies since filter was removed
  const filteredMovies = movies;

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
    fetchMovies();
  }, []);

  // Fetch user votes when wallet connects
  useEffect(() => {
    if (isConnected && address) {
      fetchUserVotes();
    }
  }, [isConnected, address]);

  const handleVote = async (id: string, vote: 'yes' | 'no') => {
    if (votes[id]) return;
    
    // Check if we're on a Celo network
    if (currentChainId !== 42220 && currentChainId !== 44787) {
      alert('Please switch to a Celo network (testnet or mainnet) before voting. Use the "Switch to Celo" button above.');
      return;
    }
    
    setCurrentVotingId(id);
    setTxStatus((prev) => ({ ...prev, [id]: 'pending' }));
    
    try {
      if (!isConnected || !address) throw new Error("Wallet not connected");

      const movieId = BigInt(parseInt(id, 10));

      // Set the vote immediately to prevent double-clicking
      setVotes((prev) => ({ ...prev, [id]: vote }));

      // Build calldata, append referral tag, and send raw transaction
      const calldata = encodeFunctionData({
        abi: VOTE_CONTRACT_ABI,
        functionName: 'vote',
        args: [movieId, vote === 'yes']
      });
      const dataWithTag = referralTag ? (calldata + referralTag.slice(2)) : calldata;
      if (!walletClient) throw new Error('Wallet client unavailable');
      const txHash = await walletClient.sendTransaction({
        account: address!,
        to: VOTE_CONTRACT_ADDRESS,
        data: dataWithTag as `0x${string}`,
        value: 0n
      });

      // Report to Divvi
      const chainId = await walletClient.getChainId();
      submitReferral({ txHash, chainId }).catch((e) => console.error('Divvi submitReferral failed:', e));

      // Save vote to MongoDB
      fetch('/api/movies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'vote', id, type: vote, userAddress: address })
      }).catch((e) => console.error('Failed to save vote to MongoDB:', e));
      
    } catch (err: any) {
      console.error('Vote error:', err);
      
      // Revert the vote if there was an error
      setVotes((prev) => ({ ...prev, [id]: null }));
      
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
      
      setTxStatus((prev) => ({ ...prev, [id]: 'error' }));
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
      
      // Refresh movies to get updated vote counts
      setTimeout(() => fetchMovies(), 1000);
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
  const handleVoteSaveError = async (id: string, vote: 'yes' | 'no') => {
    try {
      const response = await fetch('/api/movies', {
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
      <div className="max-w-2xl mx-auto px-4">
        <Header showSearch={true} />
        <div className="flex items-center justify-center mt-20">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-white/60" />
            <p className="text-white/60">Loading movies...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4">
      {/* Page Header */}

      <Header showSearch={true} />
      <div className="flex items-center mt-10 mb-6">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => router.back()} 
          className="mr-3 p-2 bg-white hover:bg-white/10"
        >
          <ArrowLeft size={18} />
        </Button>
        <h1 className="text-xl font-semibold text-white">Vote on Movies</h1>
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

          {/* Testnet Warning */}
          {currentChainId === 44787 && (
            <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-md">
              <p className="text-blue-400 text-xs">
                🧪 You're on Celo Testnet (Alfajores). This is safer for testing! Get testnet CELO from the <a href="https://faucet.celo.org/alfajores" target="_blank" rel="noopener noreferrer" className="underline">Celo Faucet</a>.
              </p>
            </div>
          )}

          {/* Mainnet Success Message */}
          {currentChainId === 42220 && (
            <div className="mt-3 p-3 bg-green-500/10 border border-green-500/20 rounded-md">
              <p className="text-green-400 text-xs">
                ✅ You're on Celo Mainnet! Ready for real voting with actual CELO.
              </p>
            </div>
          )}
        </div>
      )}

            {/* Movies List */}
      <div className="space-y-6">
            {filteredMovies.map((movie) => (
          <Card key={movie.id} className={`bg-[#18181B] text-white border overflow-hidden cursor-pointer ${
            votes[movie.id] 
              ? 'border-green-500/30 bg-green-500/5' 
              : 'border-white/10'
          }`} onClick={() => router.push(`/movies/${movie.id}`)}>
                <CardContent className="p-0">
              <div className="flex">
                {/* Movie Poster - Made bigger */}
                <div className="w-40 h-60 relative bg-neutral-900 flex-shrink-0">
                    {movie.posterUrl ? (
                      <Image
                        src={ensureFullPosterUrl(movie.posterUrl) || ''}
                        alt={movie.title}
                        fill
                      className="object-cover w-full h-full"
                      sizes="160px"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-white/40">
                        <span className="text-sm">No Poster</span>
                      </div>
                    )}
                  </div>
                  
                {/* Movie Info & Voting */}
                <div className="flex-1 p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between mb-3">
                      <CardTitle className="text-lg font-semibold line-clamp-2 flex-1">
                      {movie.title}
                    </CardTitle>
                      <WatchlistButton movieId={movie.id} size="sm" className="ml-3 flex-shrink-0" />
                    </div>
                    
                    <CardDescription className="text-sm text-white/60 mb-4">
                      {movie.genres && movie.genres.length > 0 ? movie.genres[0] : ''} {movie.releaseYear ? movie.releaseYear : ''}
                    </CardDescription>
                    
                    {/* Movie Description */}
                    <div className="text-sm text-white/70 mb-4 line-clamp-3">
                      {movie.description || 'No description available'}
                    </div>
                    
                    <Link 
                      href={`/movies/${movie.id}`}
                      className="inline-block mb-4"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button 
                        variant="link" 
                        size="sm" 
                        className="p-0 text-left underline text-sm text-blue-400 hover:text-blue-300"
                      >
                        View More Details
                      </Button>
                    </Link>

                    {/* Vote Counts Display */}
                    <div className="flex items-center gap-6 text-sm text-white/60 mb-4">
                      <span className="flex items-center gap-2">
                        <ThumbsUp size={16} className="text-green-400" />
                        <span className="font-medium">{movie.votes.yes} Yes</span>
                      </span>
                      <span className="flex items-center gap-2">
                        <ThumbsDown size={16} className="text-red-400" />
                        <span className="font-medium">{movie.votes.no} No</span>
                      </span>
                    </div>
                  </div>
                    
                    {/* Vote Buttons */}
                  <div className="flex items-center gap-4">
                                             <Button
                         variant={votes[movie.id] === 'yes' ? 'default' : 'ghost'}
                         onClick={(e) => { e.stopPropagation(); handleVote(movie.id, 'yes'); }}
                         disabled={!isConnected || isPending || !!votes[movie.id]}
                         className={`flex items-center gap-2 px-6 py-3 ${
                           votes[movie.id] === 'yes' 
                             ? 'bg-green-600 hover:bg-green-700 text-white' 
                             : 'hover:bg-green-600'
                         }`}
                         size="default"
                       >
                         <div className={`relative ${votes[movie.id] === 'yes' ? 'animate-pulse' : ''}`}>
                           <ThumbsUp size={18} />
                           {votes[movie.id] === 'yes' && (
                             <div className="absolute inset-0 bg-green-400/30 rounded-full blur-sm scale-150"></div>
                           )}
                         </div>
                         <span className="text-sm font-medium">
                           {votes[movie.id] === 'yes' ? 'Voted Yes ✓' : 'Yes'}
                         </span>
                       </Button>
                      
                                             <Button
                         variant={votes[movie.id] === 'no' ? 'destructive' : 'ghost'}
                         onClick={(e) => { e.stopPropagation(); handleVote(movie.id, 'no'); }}
                         disabled={!isConnected || isPending || !!votes[movie.id]}
                         className={`flex items-center gap-2 px-6 py-3 ${
                           votes[movie.id] === 'no' 
                             ? 'bg-red-600 hover:bg-red-700 text-white' 
                             : 'hover:bg-red-600'
                         }`}
                         size="default"
                       >
                         <div className={`relative ${votes[movie.id] === 'no' ? 'animate-pulse' : ''}`}>
                           <ThumbsDown size={18} />
                           {votes[movie.id] === 'no' && (
                             <div className="absolute inset-0 bg-red-400/30 rounded-full blur-sm scale-150"></div>
                           )}
                         </div>
                         <span className="text-sm font-medium">
                           {votes[movie.id] === 'no' ? 'Voted No ✓' : 'No'}
                         </span>
                       </Button>
                     
                     {/* Status Messages */}
                     <div className="flex-1 text-right">
                       {isPending && currentVotingId === movie.id && (
                         <span className="text-yellow-400 text-sm">Confirming...</span>
                       )}
                       {votes[movie.id] && !isPending && (
                         <span className="text-green-400 text-sm font-medium">
                           {votes[movie.id] === 'yes' ? 'Voted Yes' : 'Voted No'}
                         </span>
                       )}
                     </div>
                   </div>
                   
                   {/* Voted Already Message */}
                   {votes[movie.id] && (
                     <div className="mt-3 text-center">
                       <span className="text-sm text-green-400 font-medium bg-green-400/10 px-3 py-1 rounded-full">
                         ✓ You've voted already on this movie
                       </span>
                     </div>
                   )}
                 </div>
               </div>
             </CardContent>
           </Card>
            ))}
          </div>
    </div>
  );
}
