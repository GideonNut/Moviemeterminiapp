"use client";
import { useState } from "react";
import voteMoviesData from "../../data/vote-movies.json";
import { Card, CardContent, CardTitle, CardDescription } from "~/components/ui/card";
import { Button } from "~/components/ui/Button";
import Image from "next/image";
import { VOTE_CONTRACT_ADDRESS, VOTE_CONTRACT_ABI } from "~/constants/voteContract";
import { useAccount, useChainId, useSwitchChain, useWalletClient } from "wagmi";
import { writeContract } from "viem/actions";
import { useRouter } from "next/navigation";
import Header from "~/components/Header";
import { ArrowLeft,  ThumbsUp, ThumbsDown} from "lucide-react";


export default function VoteMoviesPage() {
  const router = useRouter();
  const [voteMovies] = useState<typeof voteMoviesData>(voteMoviesData);
  const [votes, setVotes] = useState<{ [id: string]: 'yes' | 'no' | null }>({});
  const [txStatus, setTxStatus] = useState<{ [id: string]: string }>({});

  const { address, isConnected } = useAccount();
  const currentChainId = useChainId();
  const { switchChainAsync } = useSwitchChain();
  const { data: walletClient } = useWalletClient();

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

      await writeContract(walletClient, {
        address: VOTE_CONTRACT_ADDRESS,
        abi: VOTE_CONTRACT_ABI,
        functionName: "vote",
        args: [movieId, vote === 'yes'],
      });

      setVotes((prev) => ({ ...prev, [id]: vote }));
      setTxStatus((prev) => ({ ...prev, [id]: 'success' }));
    } catch (err) {
      setTxStatus((prev) => ({ ...prev, [id]: 'error' }));
    }
  };

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

      {/* Movies List */}
      <div className="space-y-4">
        {voteMovies.map((movie) => (
          <Card key={movie.id} className="bg-[#18181B] text-white border border-white/10 overflow-hidden">
            <CardContent className="p-0">
              <div className="flex">
                {/* Movie Poster */}
                <div className="w-24 h-36 relative bg-neutral-900 flex-shrink-0">
                  <Image
                    src={movie.posterUrl}
                    alt={movie.title}
                    fill
                    className="object-cover"
                    sizes="96px"
                  />
                </div>
                
                {/* Movie Info & Voting */}
                <div className="flex-1 p-4 flex flex-col justify-between">
                  <div>
                    <CardTitle className="text-base font-semibold mb-1 line-clamp-2">
                      {movie.title}
                    </CardTitle>
                    <CardDescription className="text-sm text-white/60 mb-3">
                      {movie.genre} • {movie.year}
                    </CardDescription>
                  </div>
                  
                  {/* Vote Buttons */}
                  <div className="flex items-center gap-3">
                    <Button
                      variant={votes[movie.id] === 'yes' ? 'default' : 'ghost'}
                      onClick={() => handleVote(movie.id, 'yes')}
                      disabled={!isConnected || txStatus[movie.id] === 'pending' || !!votes[movie.id]}
                      className="flex items-center gap-2 px-4 py-2"
                      size="sm"
                    >
                      <ThumbsUp size={16} />
                      <span className="text-sm">Yes</span>
                    </Button>
                    
                    <Button
                      variant={votes[movie.id] === 'no' ? 'destructive' : 'ghost'}
                      onClick={() => handleVote(movie.id, 'no')}
                      disabled={!isConnected || txStatus[movie.id] === 'pending' || !!votes[movie.id]}
                      className="flex items-center gap-2 px-4 py-2"
                      size="sm"
                    >
                      <ThumbsDown size={16} />
                      <span className="text-sm">No</span>
                    </Button>
                    
                    {/* Status Messages */}
                    <div className="flex-1 text-right">
                      {txStatus[movie.id] === 'pending' && (
                        <span className="text-yellow-400 text-xs">Confirming...</span>
                      )}
                      {txStatus[movie.id] === 'success' && (
                        <span className="text-green-400 text-xs">✓ Voted!</span>
                      )}
                      {txStatus[movie.id] === 'error' && (
                        <span className="text-red-400 text-xs">✗ Failed</span>
                      )}
                      {votes[movie.id] && !txStatus[movie.id] && (
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