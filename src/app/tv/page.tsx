"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardTitle, CardDescription } from "~/components/ui/card";
import { Button } from "~/components/ui/Button";
import Image from "next/image";
import { VOTE_CONTRACT_ADDRESS, VOTE_CONTRACT_ABI } from "~/constants/voteContract";
import { useAccount, useChainId, useSwitchChain, useWriteContract, useBalance, useWalletClient } from "wagmi";
import { encodeFunctionData } from "viem";
import { getDataSuffix, submitReferral } from "@divvi/referral-sdk";
import { useRouter } from "next/navigation";
import Header from "~/components/Header";
import { ArrowLeft,  RefreshCw, AlertCircle } from "lucide-react";
import { formatCELOBalance, hasSufficientCELOForGas, ensureFullPosterUrl } from "~/lib/utils";
import { ThumbsDownIcon, ThumbsUpIcon } from "~/components/icons";

interface TVShow {
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

export default function TVPage() {
  const router = useRouter();
  const [tvShows, setTvShows] = useState<TVShow[]>([]);
  const [loading, setLoading] = useState(true);
  const [votes, setVotes] = useState<{ [id: string]: 'yes' | 'no' | null }>({});
  const [txStatus, setTxStatus] = useState<{ [id: string]: string }>({});
  const [currentVotingId, setCurrentVotingId] = useState<string | null>(null);
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

  const fetchTVShows = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/tv');
      if (response.ok) {
        const data = await response.json();
        setTvShows(data.tvShows || []);
      } else {
        console.error('Failed to fetch TV shows');
      }
    } catch (error) {
      console.error('Error fetching TV shows:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch user's previous votes from MongoDB
  const fetchUserVotes = async () => {
    if (!isConnected || !address) return;
    
    try {
      const response = await fetch('/api/tv', {
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
    fetchTVShows();
  }, []);

  // Fetch user votes when wallet connects
  useEffect(() => {
    if (isConnected && address) {
      fetchUserVotes();
    }
  }, [isConnected, address]);

  const handleVote = async (id: string, vote: 'yes' | 'no') => {
    if (votes[id]) {
      alert('You have already voted on this TV show.');
      return;
    }
    
    // Check if we're on the correct network first
    if (currentChainId !== 42220) {
      alert('Please switch to the Celo network before voting. Use the "Switch to Celo" button above.');
      return;
    }
    
    setCurrentVotingId(id);
    setTxStatus((prev) => ({ ...prev, [id]: 'pending' }));
    
    try {
      if (!isConnected || !address) throw new Error("Wallet not connected");

      const tvShowId = BigInt(parseInt(id, 10));

      // Set the vote immediately to prevent double-clicking
      setVotes((prev) => ({ ...prev, [id]: vote }));

      // Build calldata, append referral tag, and send raw transaction
      const calldata = encodeFunctionData({
        abi: VOTE_CONTRACT_ABI,
        functionName: 'vote',
        args: [tvShowId, vote === 'yes']
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
      fetch('/api/tv', {
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
        errorMessage = 'Smart contract execution failed. This could mean:\n\n1. The TV show ID does not exist on the contract\n2. The contract has an error\n3. You have already voted on this TV show\n\nPlease check if the TV show exists on the contract first.';
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
        fetch('/api/tv', {
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
      
      // Refresh TV shows to get updated vote counts
      setTimeout(() => fetchTVShows(), 1000);
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
        errorMessage = 'Smart contract execution failed. This could mean:\n\n1. The TV show ID does not exist on the contract\n2. The contract has an error\n3. You have already voted on this TV show\n\nPlease check if the TV show exists on the contract first.';
      } else if (error.message?.includes('gas')) {
        errorMessage = 'Gas estimation failed. Please try again.';
      }
      
      // Update the status for the specific TV show being voted on
      setTxStatus((prev) => ({ ...prev, [currentVotingId]: 'error' }));
      
      // Clear the current voting ID
      setCurrentVotingId(null);
      
      alert(errorMessage);
    }
  }, [error, currentVotingId]);

  // Handle MongoDB vote save errors
  const handleVoteSaveError = async (id: string, vote: 'yes' | 'no') => {
    try {
      const response = await fetch('/api/tv', {
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
          alert('You have already voted on this TV show. Each user can only vote once per TV show.');
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
            <p className="text-white/60">Loading TV shows...</p>
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
        <h1 className="text-xl font-semibold text-white">Back to TV Shows</h1>
      </div>
      <div className="flex items-center mt-10 mb-6">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => router.back()} 
          className="mr-3 p-2 bg-white hover:bg-white/10"
        >
          <ArrowLeft size={18} />
        </Button>
        <h1 className="text-xl font-semibold text-white">Vote on TV Shows</h1>
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

      {/* TV Shows List */}
      <div className="space-y-6">
        {tvShows.map((tvShow) => (
          <Card key={tvShow.id} className={`bg-[#18181B] text-white border overflow-hidden cursor-pointer ${
            votes[tvShow.id] 
              ? 'border-green-500/30 bg-green-500/5' 
              : 'border-white/10'
          }`} onClick={() => router.push(`/tv/${tvShow.id}`)}>
            <CardContent className="p-0">
              <div className="flex flex-col">
                {/* TV Show Poster (portrait) */}
                <div className="relative aspect-[2/3] w-full bg-neutral-900">
                  {tvShow.posterUrl ? (
                    <Image
                      src={ensureFullPosterUrl(tvShow.posterUrl) || ''}
                      alt={tvShow.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      <span className="text-sm">No Poster</span>
                    </div>
                  )}
                </div>
                
                {/* TV Show Info & Voting */}
                <div className="p-6 flex flex-col justify-between text-left">
                  <div>
                    <CardTitle className="text-lg font-semibold mb-3 line-clamp-2">
                      {tvShow.title}
                    </CardTitle>
                    <CardDescription className="text-sm text-muted-foreground mb-4">
                      <span className="truncate block">{tvShow.genres && tvShow.genres.length > 0 ? tvShow.genres[0] : ''} {tvShow.releaseYear ? tvShow.releaseYear : ''}</span>
                    </CardDescription>
                    
                    {/* TV Show Description */}
                    <div className="text-sm text-muted-foreground mb-4 line-clamp-3">
                      {tvShow.description || 'No description available'}
                    </div>
                    
                    {/* Vote Counts Display */}
                    <div className="flex items-center gap-6 text-sm text-muted-foreground mb-4">
                      <span className="flex items-center gap-2 min-w-0">
                        <ThumbsUpIcon size={16} className="flex-shrink-0" />
                        <span className="font-medium whitespace-nowrap">Yes: {tvShow.votes.yes}</span>
                      </span>
                      <span className="flex items-center gap-2 min-w-0">
                        <ThumbsDownIcon size={16} className="flex-shrink-0" />
                        <span className="font-medium whitespace-nowrap">No: {tvShow.votes.no}</span>
                      </span>
                    </div>
                  </div>
                  
                  {/* Vote Buttons */}
                  <div className="flex items-center gap-4">
                    <Button
                      variant={votes[tvShow.id] === 'yes' ? 'default' : 'outline'}
                      onClick={(e) => { e.stopPropagation(); handleVote(tvShow.id, 'yes'); }}
                      disabled={!isConnected || isPending || !!votes[tvShow.id]}
                      className={"flex items-center gap-2 px-6 py-3"}
                      size="default"
                    >
                      <div className={`relative ${votes[tvShow.id] === 'yes' ? 'animate-pulse' : ''}`}>
                        <ThumbsUpIcon size={18} />
                        {votes[tvShow.id] === 'yes' && (
                          <div className="absolute inset-0 bg-ring/20 rounded-full blur-sm scale-150"></div>
                        )}
                      </div>
                      <span className="text-sm font-medium">
                        {votes[tvShow.id] === 'yes' ? 'Voted Yes' : 'Yes'}
                      </span>
                    </Button>
                    
                    <Button
                      variant={votes[tvShow.id] === 'no' ? 'default' : 'outline'}
                      onClick={(e) => { e.stopPropagation(); handleVote(tvShow.id, 'no'); }}
                      disabled={!isConnected || isPending || !!votes[tvShow.id]}
                      className={"flex items-center gap-2 px-6 py-3"}
                      size="default"
                    >
                      <div className={`relative ${votes[tvShow.id] === 'no' ? 'animate-pulse' : ''}`}>
                        <ThumbsDownIcon size={18} />
                        {votes[tvShow.id] === 'no' && (
                          <div className="absolute inset-0 bg-ring/20 rounded-full blur-sm scale-150"></div>
                        )}
                      </div>
                      <span className="text-sm font-medium">
                        {votes[tvShow.id] === 'no' ? 'Voted No' : 'No'}
                      </span>
                    </Button>
                    
                    {/* Status Messages */}
                    <div className="flex-1 text-right">
                      {isPending && currentVotingId === tvShow.id && (
                        <span className="text-yellow-400 text-sm">Confirming...</span>
                      )}
                    </div>
                  </div>
                  
                  {/* Voted Already Message */}
                  {votes[tvShow.id] && (
                    <div className="mt-3 text-center">
                      <span className="text-sm font-medium bg-accent text-accent-foreground px-3 py-1 rounded-full">
                        You've voted already on this TV show
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
