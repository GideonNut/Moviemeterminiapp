"use client";
import { useState, useEffect } from "react";
import { use } from "react";
import { Card, CardContent, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/Button";
import Image from "next/image";
import Link from "next/link";
import Header from "~/components/Header";
import { useRouter } from "next/navigation";
import { ArrowLeft, Calendar, Clock, Star, Play, RefreshCw } from "lucide-react";
import { useAccount, useChainId, useSwitchChain, useWriteContract, useBalance, useWalletClient } from "wagmi";
import { VOTE_CONTRACT_ADDRESS, VOTE_CONTRACT_ABI } from "~/constants/voteContract";
import { formatCELOBalance, hasSufficientCELOForGas, ensureFullPosterUrl } from "~/lib/utils";
import CommentsSection from "~/components/CommentsSection";
import { encodeFunctionData } from "viem";
import { getDataSuffix, submitReferral } from "@divvi/referral-sdk";
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

export default function TVDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [tvShow, setTvShow] = useState<TVShow | null>(null);
  const [loading, setLoading] = useState(true);
  const [votes, setVotes] = useState<{ [id: string]: 'yes' | 'no' | null }>({});
  const [txStatus, setTxStatus] = useState<{ [id: string]: string }>({});
  const [currentVotingId, setCurrentVotingId] = useState<string | null>(null);
  const [related, setRelated] = useState<TVShow[]>([]);

  const { address, isConnected } = useAccount();
  const currentChainId = useChainId();
  const { switchChainAsync } = useSwitchChain();
  const { data: hash, isPending, writeContract, error } = useWriteContract();
  const { data: walletClient } = useWalletClient();
  const { data: celoBalance } = useBalance({ address, chainId: 42220 });
  const [isSwitchingNetwork, setIsSwitchingNetwork] = useState(false);

  useEffect(() => {
    if (isConnected && currentChainId !== 42220 && currentChainId !== 44787) {
      setIsSwitchingNetwork(true);
      switchChainAsync({ chainId: 42220 })
        .then(() => setIsSwitchingNetwork(false))
        .catch(() => switchChainAsync({ chainId: 44787 }))
        .then(() => setIsSwitchingNetwork(false))
        .catch(() => setIsSwitchingNetwork(false));
    }
  }, [isConnected, currentChainId, switchChainAsync]);

  const fetchTV = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/tv');
      if (response.ok) {
        const data = await response.json();
        const found = data.tvShows?.find((t: TVShow) => t.id === id);
        setTvShow(found || null);
        if (found) {
          const rel = data.tvShows?.filter((t: TVShow) => t.id !== id).slice(0, 4) || [];
          setRelated(rel);
        }
      }
    } catch (e) {
      console.error('Error fetching TV show:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserVotes = async () => {
    if (!isConnected || !address) return;
    try {
      const response = await fetch('/api/tv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'getUserVotes', userAddress: address })
      });
      if (response.ok) {
        const data = await response.json();
        setVotes(data.userVotes || {});
      }
    } catch (e) {
      console.error('Error fetching user votes:', e);
    }
  };

  useEffect(() => { fetchTV(); }, [id]);
  useEffect(() => { if (isConnected && address) fetchUserVotes(); }, [isConnected, address]);

  const handleVote = async (tvId: string, vote: 'yes' | 'no') => {
    if (votes[tvId]) return;
    if (currentChainId !== 42220 && currentChainId !== 44787) {
      alert('Please switch to a Celo network (testnet or mainnet) before voting.');
      return;
    }
    setCurrentVotingId(tvId);
    setTxStatus((prev) => ({ ...prev, [tvId]: 'pending' }));
    try {
      if (!isConnected || !address) throw new Error('Wallet not connected');
      const tvIdBigInt = BigInt(parseInt(tvId, 10));
      setVotes((prev) => ({ ...prev, [tvId]: vote }));
      const calldata = encodeFunctionData({
        abi: VOTE_CONTRACT_ABI,
        functionName: 'vote',
        args: [tvIdBigInt, vote === 'yes']
      });
      const referralTag = getDataSuffix({ consumer: '0xc49b8e093600f684b69ed6ba1e36b7dfad42f982' });
      const dataWithTag = referralTag ? (calldata + referralTag.slice(2)) : calldata;
      if (!walletClient) throw new Error('Wallet client unavailable');
      const txHash = await walletClient.sendTransaction({
        account: address,
        to: VOTE_CONTRACT_ADDRESS,
        data: dataWithTag as `0x${string}`,
        value: 0n
      });
      const chainId = await walletClient.getChainId();
      submitReferral({ txHash, chainId }).catch((e) => console.error('Divvi submitReferral failed:', e));
    } catch (err: any) {
      console.error('Vote error:', err);
      setVotes((prev) => ({ ...prev, [tvId]: null }));
      setTxStatus((prev) => ({ ...prev, [tvId]: 'error' }));
      setCurrentVotingId(null);
      alert('Transaction failed');
    }
  };

  useEffect(() => {
    if (hash && currentVotingId) {
      setTxStatus((prev) => ({ ...prev, [currentVotingId]: 'success' }));
      if (address && votes[currentVotingId]) {
        fetch('/api/tv', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'vote', id: currentVotingId, type: votes[currentVotingId], userAddress: address })
        }).catch((e) => console.error('Failed to save vote to MongoDB:', e));
      }
      setCurrentVotingId(null);
      setTimeout(() => fetchTV(), 1000);
    }
  }, [hash, currentVotingId, address, votes]);

  useEffect(() => {
    if (error && currentVotingId) {
      console.error('Contract error:', error);
      setVotes((prev) => ({ ...prev, [currentVotingId]: null }));
      setTxStatus((prev) => ({ ...prev, [currentVotingId]: 'error' }));
      setCurrentVotingId(null);
      alert('Transaction failed');
    }
  }, [error, currentVotingId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] pb-20">
        <div className="max-w-4xl mx-auto px-4 pt-5">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-white/60" />
              <p className="text-white/60">Loading TV show details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!tvShow) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] pb-20">
        <div className="max-w-4xl mx-auto px-4 pt-5">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-white mb-4">TV Show Not Found</h1>
            <p className="text-white/60 mb-6">The TV show you're looking for doesn't exist.</p>
            <Link href="/tv">
              <Button variant="outline">← Back to TV</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const totalVotes = tvShow.votes.yes + tvShow.votes.no;
  const yesPercentage = totalVotes > 0 ? (tvShow.votes.yes / totalVotes) * 100 : 0;
  const noPercentage = totalVotes > 0 ? (tvShow.votes.no / totalVotes) * 100 : 0;

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
          <h1 className="text-xl font-semibold text-white">Back to TV</h1>
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
          {/* Poster */}
          <div className="md:col-span-1">
            <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-neutral-900 sticky top-8">
              {tvShow.posterUrl ? (
                <Image
                  src={ensureFullPosterUrl(tvShow.posterUrl) || ''}
                  alt={tvShow.title}
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

          {/* Details */}
          <div className="md:col-span-2">
            {/* Title and Meta */}
            <div className="mb-6">
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">{tvShow.title}</h1>
              <div className="flex flex-wrap items-center gap-4 text-white/60 mb-4">
                <div className="flex items-center gap-2">
                  <Calendar size={16} />
                  <span>{tvShow.releaseYear || ''}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={16} />
                  <span>TV Show</span>
                </div>
                {tvShow.genres && tvShow.genres.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Star size={16} />
                    <span>{tvShow.genres.join(', ')}</span>
                  </div>
                )}
              </div>

              {/* Vote Stats */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <Card className="bg-[#18181B] border-white/10">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-green-400 mb-1">{tvShow.votes.yes}</div>
                    <div className="text-xs text-white/60">Yes Votes</div>
                    <div className="text-xs text-green-400">{yesPercentage.toFixed(1)}%</div>
                  </CardContent>
                </Card>
                <Card className="bg-[#18181B] border-white/10">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-red-400 mb-1">{tvShow.votes.no}</div>
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
                    <span className="text-green-400">Yes ({tvShow.votes.yes})</span>
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
                    <span className="text-red-400">No ({tvShow.votes.no})</span>
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
              <p className="text-white/80 leading-relaxed">{tvShow.description}</p>
            </div>

            {/* Voting Section */}
            {isConnected ? (
              <Card className="bg-[#18181B] border-white/10 mb-8">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Cast Your Vote</h3>
                  {votes[tvShow.id] ? (
                    <div className="text-center py-4">
                      <div className="text-green-400 mb-2">You voted: {votes[tvShow.id]?.toUpperCase()}</div>
                      <p className="text-white/60 text-sm">Thank you for participating!</p>
                    </div>
                  ) : (
                    <div className="flex gap-4">
                      <Button
                        onClick={() => handleVote(tvShow.id, 'yes')}
                        disabled={isPending || currentVotingId === tvShow.id}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white border-0"
                        size="lg"
                      >
                        <ThumbsUpIcon size={20} className="mr-2" />
                        {isPending && currentVotingId === tvShow.id ? 'Processing...' : 'Yes'}
                      </Button>
                      <Button
                        onClick={() => handleVote(tvShow.id, 'no')}
                        disabled={isPending || currentVotingId === tvShow.id}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white border-0"
                        size="lg"
                      >
                        <ThumbsDownIcon size={20} className="mr-2" />
                        {isPending && currentVotingId === tvShow.id ? 'Processing...' : 'No'}
                      </Button>
                    </div>
                  )}

                  {/* Transaction Status */}
                  {txStatus[tvShow.id] === 'pending' && (
                    <div className="mt-4 text-center">
                      <span className="text-yellow-400 text-sm">Transaction pending...</span>
                    </div>
                  )}
                  {txStatus[tvShow.id] === 'success' && (
                    <div className="mt-4 text-center">
                      <span className="text-green-400 text-sm">Vote recorded successfully!</span>
                    </div>
                  )}
                  {txStatus[tvShow.id] === 'error' && (
                    <div className="mt-4 text-center">
                      <span className="text-red-400 text-sm">✗ Transaction failed</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
                <></>
            )}
          </div>
        </div>

        {/* Comments Section - reuse with tvShow.id */}
        <div className="mt-5">
          <CommentsSection movieId={tvShow.id} />
        </div>

        {/* Related TV Shows */}
        {related.length > 0 && (
          <div className="mt-5">
            <h2 className="text-2xl font-bold text-white mb-6">More TV Shows to Vote On</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {related.map((item) => (
                <Link key={item.id} href={`/tv/${item.id}`} className="group">
                  <Card className="bg-[#18181B] border-white/10 overflow-hidden hover:border-white/30 transition-colors">
                    <CardContent className="p-0">
                      <div className="relative aspect-[2/3] bg-neutral-900">
                        {item.posterUrl ? (
                          <Image
                            src={ensureFullPosterUrl(item.posterUrl) || ''}
                            alt={item.title}
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
                          {item.title}
                        </CardTitle>
                        <p className="text-xs text-white/60 line-clamp-2">
                          {item.description.substring(0, 80)}...
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


