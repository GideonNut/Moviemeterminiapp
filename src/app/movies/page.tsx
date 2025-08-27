"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardTitle, CardDescription } from "~/components/ui/card";
import { Button } from "~/components/ui/Button";
import Image from "next/image";
import { VOTE_CONTRACT_ADDRESS, VOTE_CONTRACT_ABI } from "~/constants/voteContract";
import { useAccount, useChainId, useSwitchChain, useWriteContract, useBalance } from "wagmi";
import { useRouter } from "next/navigation";
import Header from "~/components/Header";
import { ArrowLeft, ThumbsUp, ThumbsDown, Plus, RefreshCw } from "lucide-react";
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
  // Removed showMoviesWithoutPosters state since filter UI was removed

  const { address, isConnected } = useAccount();
  const currentChainId = useChainId();
  const { switchChainAsync } = useSwitchChain();
  
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
    chainId: currentChainId === 42220 ? 42220 : 44787, // Use mainnet if available, otherwise testnet
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

  const fetchMovies = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/movies');
      if (response.ok) {
        const data = await response.json();
        
        setMovies(data.movies || []);
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

  useEffect(() => {
    fetchMovies();
  }, []);

  const handleVote = async (id: string, vote: 'yes' | 'no') => {
    if (votes[id]) return;
    
    // Check if we're on a Celo network
    if (currentChainId !== 42220 && currentChainId !== 44787) {
      alert('Please switch to a Celo network (testnet or mainnet) before voting. Use the "Switch to Celo" button above.');
      return;
    }
    
    setTxStatus((prev) => ({ ...prev, [id]: 'pending' }));
    
    try {
      if (!isConnected || !address) throw new Error("Wallet not connected");

      const movieId = BigInt(parseInt(id, 10));

      // Use the proper Wagmi hook for smart contract interactions
      writeContract({
        address: VOTE_CONTRACT_ADDRESS,
        abi: VOTE_CONTRACT_ABI,
        functionName: "vote",
        args: [movieId, vote === 'yes'],
        // Remove fixed gas estimate to let viem estimate it automatically
        // gas: 150000n, // Conservative gas estimate
      });

      // Note: We'll handle success/error in useEffect below
      
    } catch (err: any) {
      console.error('Vote error:', err);
      
      // Provide more specific error messages
      let errorMessage = 'Transaction failed';
      if (err.message?.includes('insufficient funds') || err.message?.includes('insufficient balance')) {
        errorMessage = 'Insufficient CELO for gas fees. Please ensure you have enough CELO to cover transaction costs.';
      } else if (err.message?.includes('user rejected')) {
        errorMessage = 'Transaction was cancelled';
      } else if (err.message?.includes('execution reverted')) {
        errorMessage = 'Smart contract execution failed';
      } else if (err.message?.includes('gas')) {
        errorMessage = 'Gas estimation failed. Please try again.';
      } else if (err.message?.includes('method handler crashed')) {
        errorMessage = 'Smart contract interaction failed. This might be a network or contract issue. Please ensure you have sufficient CELO for gas fees on mainnet.';
      }
      
      setTxStatus((prev) => ({ ...prev, [id]: 'error' }));
      
      // Show error to user (you can add a toast notification here)
      alert(errorMessage);
    }
  };

  // Handle transaction state changes
  useEffect(() => {
    if (hash) {
      // Transaction was sent successfully
      console.log('Transaction hash:', hash);
      // Update the vote status and refresh movies
      setVotes((prev) => ({ ...prev, [Object.keys(votes)[0]]: votes[Object.keys(votes)[0]] }));
      setTxStatus((prev) => ({ ...prev, [Object.keys(votes)[0]]: 'success' }));
      
      // Refresh movies to get updated vote counts
      setTimeout(() => fetchMovies(), 1000);
    }
  }, [hash, votes]);

  // Handle errors from the contract
  useEffect(() => {
    if (error) {
      console.error('Contract error:', error);
      
      // Provide specific error messages based on the error
      let errorMessage = 'Transaction failed';
      if (error.message?.includes('insufficient funds') || error.message?.includes('insufficient balance')) {
        errorMessage = 'Insufficient CELO for gas fees. Please ensure you have enough CELO to cover transaction costs.';
      } else if (error.message?.includes('user rejected')) {
        errorMessage = 'Transaction was cancelled';
      } else if (error.message?.includes('execution reverted')) {
        errorMessage = 'Smart contract execution failed';
      } else if (error.message?.includes('gas')) {
        errorMessage = 'Gas estimation failed. Please try again.';
      }
      
      // Find which movie was being voted on and update its status
      const movieId = Object.keys(txStatus).find(key => txStatus[key] === 'pending');
      if (movieId) {
        setTxStatus((prev) => ({ ...prev, [movieId]: 'error' }));
      }
      
      alert(errorMessage);
    }
  }, [error, txStatus]);

  const handleAddMovie = () => {
    router.push('/admin');
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4">
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
    <div className="max-w-4xl mx-auto px-4">
      <Header showSearch={true} />
      
      {/* Debug Information - Remove this after testing */}
      {isConnected && (
        <div className="mb-4 p-3 rounded-lg border border-blue-500/20 bg-blue-500/10">
          <h3 className="text-blue-400 text-sm font-medium mb-2">Debug Info</h3>
          <div className="text-xs text-blue-300 space-y-1">
            <div>Wallet Address: {address?.slice(0, 6)}...{address?.slice(-4)}</div>
            <div>Current Chain ID: {currentChainId}</div>
            <div>Network: {currentChainId === 42220 ? 'Celo Mainnet' : currentChainId === 44787 ? 'Celo Alfajores (Testnet)' : isSwitchingNetwork ? 'Switching to Celo...' : `Unknown (${currentChainId})`}</div>
            <div>Network Switching: {isSwitchingNetwork ? 'Yes' : 'No'}</div>
            <div>Balance: {celoBalance ? `${formatCELOBalance(celoBalance.value)} CELO` : 'Loading...'}</div>
            <div>Sufficient for Gas: {celoBalance ? (hasSufficientCELOForGas(celoBalance.value) ? 'Yes' : 'No') : 'Unknown'}</div>
          </div>
        </div>
      )}
      
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
                {currentChainId === 42220 ? 'Celo Mainnet' : currentChainId === 44787 ? 'Celo Alfajores (Testnet)' : isSwitchingNetwork ? 'Switching to Celo...' : 'Other Network'}
              </span>
            </div>
          </div>

          {/* CELO Balance - Only show if on Celo network */}
          {(currentChainId === 42220 || currentChainId === 44787) && celoBalance && (
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
          {currentChainId !== 42220 && currentChainId !== 44787 && (
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

      {/* Add Movie Button */}
      <div className="flex items-center justify-between mt-10 mb-6">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => router.back()} 
            className="mr-3 p-2 bg-white hover:bg-white/10"
          >
            <ArrowLeft size={18} />
          </Button>
          <h1 className="text-2xl font-semibold text-white">Movies</h1>
        </div>
        
        <Button 
          onClick={handleAddMovie}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
        >
          <Plus size={16} />
          Add Movie
        </Button>
      </div>

      {/* Movies Grid */}
      {movies.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-white/40 text-lg mb-4">No movies yet</div>
          <Button onClick={handleAddMovie} className="bg-blue-600 hover:bg-blue-700">
            Add Your First Movie
          </Button>
        </div>
      ) : (
        <>
          {/* Movies Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMovies.map((movie) => (
              <Card key={movie.id} className="bg-[#18181B] text-white border border-white/10 overflow-hidden hover:border-white/20 transition-colors">
                <CardContent className="p-0">
                  {/* Movie Poster */}
                  <div className="w-full h-48 relative bg-neutral-900">
                    {movie.posterUrl ? (
                      <Image
                        src={ensureFullPosterUrl(movie.posterUrl) || ''}
                        alt={movie.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-white/40">
                        <span className="text-sm">No Poster</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Movie Info */}
                  <div className="p-4">
                    <CardTitle className="text-lg font-semibold mb-2 line-clamp-2">
                      {movie.title}
                    </CardTitle>
                    
                    <CardDescription className="text-sm text-white/60 mb-3 line-clamp-3">
                      {movie.description}
                    </CardDescription>
                    
                    <div className="flex items-center justify-between text-xs text-white/40 mb-4">
                      <span>{movie.releaseYear || 'Unknown Year'}</span>
                      {movie.genres && movie.genres.length > 0 && (
                        <span>{movie.genres[0]}</span>
                      )}
                    </div>
                    
                    {/* Vote Counts */}
                    <div className="flex items-center justify-between mb-4 text-sm">
                      <div className="flex items-center gap-1 text-green-400">
                        <ThumbsUp size={14} />
                        <span>{movie.votes.yes}</span>
                      </div>
                      <div className="flex items-center gap-1 text-red-400">
                        <ThumbsDown size={14} />
                        <span>{movie.votes.no}</span>
                      </div>
                    </div>
                    
                    {/* Vote Buttons */}
                    <div className="flex gap-2">
                      <Button
                        variant={votes[movie.id] === 'yes' ? 'default' : 'ghost'}
                        onClick={() => handleVote(movie.id, 'yes')}
                        disabled={!isConnected || isPending || !!votes[movie.id]}
                        className="flex-1 flex items-center justify-center gap-2"
                        size="sm"
                      >
                        <ThumbsUp size={16} />
                        Yes
                      </Button>
                      
                      <Button
                        variant={votes[movie.id] === 'no' ? 'destructive' : 'ghost'}
                        onClick={() => handleVote(movie.id, 'no')}
                        disabled={!isConnected || isPending || !!votes[movie.id]}
                        className="flex-1 flex items-center justify-center gap-2"
                        size="sm"
                      >
                        <ThumbsDown size={16} />
                        No
                      </Button>
                    </div>
                    
                    {/* Status Messages */}
                    <div className="mt-2 text-center">
                      {isPending && (
                        <span className="text-yellow-400 text-xs">Confirming...</span>
                      )}
                      {votes[movie.id] && !isPending && (
                        <span className="text-green-400 text-xs">✓ Voted!</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
