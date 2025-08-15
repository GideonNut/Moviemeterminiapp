"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardTitle, CardDescription } from "~/components/ui/card";
import { Button } from "~/components/ui/Button";
import Image from "next/image";
import { VOTE_CONTRACT_ADDRESS, VOTE_CONTRACT_ABI } from "~/constants/voteContract";
import { useAccount, useChainId, useSwitchChain, useWalletClient, useBalance } from "wagmi";
import { writeContract } from "viem/actions";
import { useRouter } from "next/navigation";
import Header from "~/components/Header";
import { ArrowLeft, ThumbsUp, ThumbsDown, Plus, RefreshCw, AlertCircle } from "lucide-react";
import { formatCELOBalance, hasSufficientCELOForGas } from "~/lib/utils";

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

  const { address, isConnected } = useAccount();
  const currentChainId = useChainId();
  const { switchChainAsync } = useSwitchChain();
  const { data: walletClient } = useWalletClient();
  
  // Get CELO balance for gas fees
  const { data: celoBalance } = useBalance({
    address,
    chainId: 42220,
  });

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

  useEffect(() => {
    fetchMovies();
  }, []);

  const handleVote = async (id: string, vote: 'yes' | 'no') => {
    if (votes[id]) return;
    setTxStatus((prev) => ({ ...prev, [id]: 'pending' }));
    
    try {
      if (!isConnected || !address) throw new Error("Wallet not connected");

      // Ensure we're on Celo (42220); prompt a switch if needed
      if (currentChainId !== 42220) {
        await switchChainAsync({ chainId: 42220 });
      }

      const movieId = BigInt(parseInt(id, 10));

      if (!walletClient) throw new Error("Wallet not ready");

      // Use a reasonable gas limit for voting transactions
      // Celo voting transactions typically use around 100,000 gas
      const gasLimit = 150000n; // Conservative estimate with buffer

      await writeContract(walletClient, {
        address: VOTE_CONTRACT_ADDRESS,
        abi: VOTE_CONTRACT_ABI,
        functionName: "vote",
        args: [movieId, vote === 'yes'],
        gas: gasLimit,
      });

      // Update local state
      setVotes((prev) => ({ ...prev, [id]: vote }));
      setTxStatus((prev) => ({ ...prev, [id]: 'success' }));
      
      // Refresh movies to get updated vote counts
      setTimeout(() => fetchMovies(), 1000);
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
      }
      
      setTxStatus((prev) => ({ ...prev, [id]: 'error' }));
      
      // Show error to user (you can add a toast notification here)
      alert(errorMessage);
    }
  };

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
      
      {/* Balance and Gas Status */}
      {isConnected && celoBalance && (
        <div className="mb-6 p-4 rounded-lg border border-white/10 bg-[#18181B]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-white/60 text-sm">CELO Balance:</span>
              <span className="text-white font-medium">{formatCELOBalance(celoBalance.value)} CELO</span>
            </div>
            {!hasSufficientCELOForGas(celoBalance.value) && (
              <div className="flex items-center gap-2 text-yellow-400 text-sm">
                <AlertCircle size={16} />
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {movies.map((movie) => (
            <Card key={movie.id} className="bg-[#18181B] text-white border border-white/10 overflow-hidden hover:border-white/20 transition-colors">
              <CardContent className="p-0">
                {/* Movie Poster */}
                <div className="w-full h-48 relative bg-neutral-900">
                  {movie.posterUrl ? (
                    <Image
                      src={movie.posterUrl}
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
                      disabled={!isConnected || txStatus[movie.id] === 'pending' || !!votes[movie.id]}
                      className="flex-1 flex items-center justify-center gap-2"
                      size="sm"
                    >
                      <ThumbsUp size={16} />
                      Yes
                    </Button>
                    
                    <Button
                      variant={votes[movie.id] === 'no' ? 'destructive' : 'ghost'}
                      onClick={() => handleVote(movie.id, 'no')}
                      disabled={!isConnected || txStatus[movie.id] === 'pending' || !!votes[movie.id]}
                      className="flex-1 flex items-center justify-center gap-2"
                      size="sm"
                    >
                      <ThumbsDown size={16} />
                      No
                    </Button>
                  </div>
                  
                  {/* Status Messages */}
                  {txStatus[movie.id] && (
                    <div className="mt-2 text-center">
                      {txStatus[movie.id] === 'pending' && (
                        <span className="text-yellow-400 text-xs">Confirming...</span>
                      )}
                      {txStatus[movie.id] === 'success' && (
                        <span className="text-green-400 text-xs">✓ Voted!</span>
                      )}
                      {txStatus[movie.id] === 'error' && (
                        <span className="text-red-400 text-xs">✗ Failed</span>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
