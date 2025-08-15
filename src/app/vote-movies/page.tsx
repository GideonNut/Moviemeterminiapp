"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardTitle, CardDescription } from "~/components/ui/card";
import { Button } from "~/components/ui/Button";
import Image from "next/image";
import { VOTE_CONTRACT_ADDRESS, VOTE_CONTRACT_ABI } from "~/constants/voteContract";
import { useAccount, useChainId, useSwitchChain, useWriteContract, useBalance, useReadContract } from "wagmi";
import { useRouter } from "next/navigation";
import Header from "~/components/Header";
import { ArrowLeft, ThumbsUp, ThumbsDown, RefreshCw, AlertCircle } from "lucide-react";
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

export default function VoteMoviesPage() {
  const router = useRouter();
  const [voteMovies, setVoteMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [votes, setVotes] = useState<{ [id: string]: 'yes' | 'no' | null }>({});
  const [txStatus, setTxStatus] = useState<{ [id: string]: string }>({});

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

  // Function to check if movie exists on contract
  const checkMovieExists = async (movieId: string): Promise<boolean> => {
    try {
      // For now, we'll assume the movie exists and let the contract call fail if it doesn't
      // This will be caught by the error handling in the vote function
      return true;
    } catch (error) {
      console.error('Error checking movie existence:', error);
      return false;
    }
  };

  // Function to add movie to smart contract
  const addMovieToContract = async (movieTitle: string) => {
    try {
      if (!isConnected || !address) throw new Error("Wallet not connected");
      
      // Ensure we're on Celo
      if (currentChainId !== 42220) {
        alert('Please switch to Celo network first');
        return;
      }

      // Add movie to contract
      writeContract({
        address: VOTE_CONTRACT_ADDRESS,
        abi: VOTE_CONTRACT_ABI,
        functionName: "addMovie",
        args: [movieTitle],
        gas: 200000n, // Slightly higher gas for adding movies
      });

      alert(`Adding "${movieTitle}" to smart contract...`);
    } catch (error) {
      console.error('Error adding movie to contract:', error);
      alert('Failed to add movie to contract. See console for details.');
    }
  };

  // State for contract movie count
  const [contractMovieCount, setContractMovieCount] = useState<number | null>(null);

  // Function to get movie count from contract
  const getContractMovieCount = async () => {
    try {
      if (currentChainId !== 42220) return;
      
      // This would require a read contract call, but for now we'll show a placeholder
      // In a real implementation, you'd use useReadContract hook
      setContractMovieCount(null);
    } catch (error) {
      console.error('Error getting contract movie count:', error);
    }
  };

  // Get contract info when on Celo network
  useEffect(() => {
    if (currentChainId === 42220) {
      getContractMovieCount();
    }
  }, [currentChainId]);
  
  // Get CELO balance for gas fees
  const { data: celoBalance } = useBalance({
    address,
    chainId: 42220,
  });

  // Auto-switch to Celo when wallet connects
  const [isSwitchingNetwork, setIsSwitchingNetwork] = useState(false);
  
  useEffect(() => {
    if (isConnected && currentChainId !== 42220) {
      setIsSwitchingNetwork(true);
      switchChainAsync({ chainId: 42220 })
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
        setVoteMovies(data.movies || []);
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
    
    // Check if we're on the correct network first
    if (currentChainId !== 42220) {
      alert('Please switch to the Celo network before voting. Use the "Switch to Celo" button above.');
      return;
    }
    
    setTxStatus((prev) => ({ ...prev, [id]: 'pending' }));
    
    try {
      if (!isConnected || !address) throw new Error("Wallet not connected");

      // Check if movie exists on the smart contract first
      const movieExists = await checkMovieExists(id);
      if (!movieExists) {
        throw new Error(`Movie ID ${id} does not exist on the smart contract. Please add it to the contract first.`);
      }

      const movieId = BigInt(parseInt(id, 10));

      // Use the proper Wagmi hook for smart contract interactions
      writeContract({
        address: VOTE_CONTRACT_ADDRESS,
        abi: VOTE_CONTRACT_ABI,
        functionName: "vote",
        args: [movieId, vote === 'yes'],
        gas: 150000n, // Conservative gas estimate
      });

      // Note: We'll handle success/error in useEffect below
      
    } catch (err: any) {
      console.error('Vote error:', err);
      
      // Provide more specific error messages
      let errorMessage = 'Transaction failed';
      if (err.message?.includes('does not exist on the smart contract')) {
        errorMessage = err.message;
      } else if (err.message?.includes('insufficient funds') || err.message?.includes('insufficient balance')) {
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
        errorMessage = 'Smart contract execution failed. This could mean:\n\n1. The movie ID does not exist on the contract\n2. The contract has an error\n3. You have already voted on this movie\n\nPlease check if the movie exists on the contract first.';
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

      {/* Debug Information - Remove this after testing */}
      {isConnected && (
        <div className="mb-4 p-3 rounded-lg border border-blue-500/20 bg-blue-500/10">
          <h3 className="text-blue-400 text-sm font-medium mb-2">Debug Info</h3>
          <div className="text-xs text-blue-300 space-y-1">
            <div>Wallet Address: {address?.slice(0, 6)}...{address?.slice(-4)}</div>
            <div>Current Chain ID: {currentChainId}</div>
            <div>Network: {currentChainId === 42220 ? 'Celo Mainnet' : 
                           currentChainId === 44787 ? 'Celo Alfajores' : 
                           isSwitchingNetwork ? 'Switching to Celo...' : `Unknown (${currentChainId})`}</div>
            <div>Network Switching: {isSwitchingNetwork ? 'Yes' : 'No'}</div>
            <div>Balance: {celoBalance ? `${formatCELOBalance(celoBalance.value)} CELO` : 'Loading...'}</div>
            <div>Sufficient for Gas: {celoBalance ? (hasSufficientCELOForGas(celoBalance.value) ? 'Yes' : 'No') : 'Unknown'}</div>
            <div className="mt-2 pt-2 border-t border-blue-500/20">
              <div className="font-medium text-blue-200">Contract Info:</div>
              <div>Contract Address: {VOTE_CONTRACT_ADDRESS.slice(0, 6)}...{VOTE_CONTRACT_ADDRESS.slice(-4)}</div>
              <div>Available Movies: {voteMovies.length}</div>
              <div>Movie IDs: {voteMovies.map(m => m.id).join(', ')}</div>
              <div>Contract Movie Count: {contractMovieCount !== null ? contractMovieCount : 'Check CeloScan'}</div>
            </div>
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

      {/* Movies List */}
      <div className="space-y-4">
        {/* Warning about movie ID sync */}
        {voteMovies.length > 0 && (
          <div className="mb-4 p-3 rounded-lg border border-orange-500/20 bg-orange-500/10">
            <p className="text-orange-400 text-xs mb-2">
              ⚠️ <strong>Important:</strong> Make sure these movie IDs exist on the smart contract at {VOTE_CONTRACT_ADDRESS.slice(0, 6)}...{VOTE_CONTRACT_ADDRESS.slice(-4)}. 
              If a movie ID doesn't exist on the contract, voting will fail.
            </p>
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  const movieTitle = prompt('Enter movie title to add to contract:');
                  if (movieTitle) {
                    addMovieToContract(movieTitle);
                  }
                }}
                size="sm"
                className="bg-orange-600 hover:bg-orange-700 text-xs"
              >
                Add Movie to Contract
              </Button>
              <Button
                onClick={() => {
                  alert(`Current contract address: ${VOTE_CONTRACT_ADDRESS}\n\nTo check if movies exist:\n1. Go to CeloScan: https://celoscan.io/address/${VOTE_CONTRACT_ADDRESS}\n2. Check the "Contract" tab\n3. Call the "movies" function with different IDs (0, 1, 2, etc.)`);
                }}
                size="sm"
                variant="ghost"
                className="text-orange-400 hover:text-orange-300 text-xs"
              >
                How to Check Contract
              </Button>
            </div>
          </div>
        )}
        
        {voteMovies.map((movie) => (
          <Card key={movie.id} className="bg-[#18181B] text-white border border-white/10 overflow-hidden">
            <CardContent className="p-0">
              <div className="flex">
                {/* Movie Poster */}
                <div className="w-24 h-36 relative bg-neutral-900 flex-shrink-0">
                  {movie.posterUrl ? (
                    <Image
                      src={movie.posterUrl}
                      alt={movie.title}
                      fill
                      className="object-cover"
                      sizes="96px"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-white/40">
                      <span className="text-xs">No Poster</span>
                    </div>
                  )}
                </div>
                
                {/* Movie Info & Voting */}
                <div className="flex-1 p-4 flex flex-col justify-between">
                  <div>
                    <CardTitle className="text-base font-semibold mb-1 line-clamp-2">
                      {movie.title}
                    </CardTitle>
                    <CardDescription className="text-sm text-white/60 mb-3">
                      {movie.genres && movie.genres.length > 0 ? movie.genres[0] : 'Unknown'} • {movie.releaseYear || 'Unknown Year'}
                    </CardDescription>
                  </div>
                  
                  {/* Vote Buttons */}
                  <div className="flex items-center gap-3">
                    <Button
                      variant={votes[movie.id] === 'yes' ? 'default' : 'ghost'}
                      onClick={() => handleVote(movie.id, 'yes')}
                      disabled={!isConnected || isPending || !!votes[movie.id]}
                      className="flex items-center gap-2 px-4 py-2"
                      size="sm"
                    >
                      <ThumbsUp size={16} />
                      <span className="text-sm">Yes</span>
                    </Button>
                    
                    <Button
                      variant={votes[movie.id] === 'no' ? 'destructive' : 'ghost'}
                      onClick={() => handleVote(movie.id, 'no')}
                      disabled={!isConnected || isPending || !!votes[movie.id]}
                      className="flex items-center gap-2 px-4 py-2"
                      size="sm"
                    >
                      <ThumbsDown size={16} />
                      <span className="text-sm">No</span>
                    </Button>
                    
                    {/* Status Messages */}
                    <div className="flex-1 text-right">
                      {isPending && (
                        <span className="text-yellow-400 text-xs">Confirming...</span>
                      )}
                      {votes[movie.id] && !isPending && (
                        <span className="text-blue-400 text-xs">
                          {votes[movie.id] === 'yes' ? 'Voted Yes' : 'Voted No'}
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
    </div>
  );
}