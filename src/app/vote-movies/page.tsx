"use client";
import { useState } from "react";
import voteMoviesData from "../../data/vote-movies.json";
import { Card, CardContent, CardTitle, CardDescription } from "~/components/ui/card";
import { Button } from "~/components/ui/Button";
import Image from "next/image";
import { VOTE_CONTRACT_ADDRESS, VOTE_CONTRACT_ABI } from "~/constants/voteContract";
import { useWalletClient } from "wagmi";
import { writeContract } from "viem/actions";
import { useRouter } from "next/navigation";

export default function VoteMoviesPage() {
  const router = useRouter();
  const [voteMovies] = useState<typeof voteMoviesData>(voteMoviesData);
  const [votes, setVotes] = useState<{ [id: string]: 'yes' | 'no' | null }>({});
  const [txStatus, setTxStatus] = useState<{ [id: string]: string }>({});

  const { data: walletClient } = useWalletClient();

  const handleVote = async (id: string, vote: 'yes' | 'no') => {
    if (votes[id]) return; // Prevent multiple votes
    setVotes((prev) => ({ ...prev, [id]: vote }));
    setTxStatus((prev) => ({ ...prev, [id]: 'pending' }));
    try {
      // Movie id must be uint256 for contract
      const movieId = parseInt(id, 10);
      if (!walletClient) throw new Error("Wallet not connected");
      await writeContract(walletClient, {
        address: VOTE_CONTRACT_ADDRESS,
        abi: VOTE_CONTRACT_ABI,
        functionName: "vote",
        args: [movieId, vote === 'yes'],
      });
      setTxStatus((prev) => ({ ...prev, [id]: 'success' }));
    } catch (err) {
      setTxStatus((prev) => ({ ...prev, [id]: 'error' }));
    }
  };

  return (
    <main className="pt-32 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 min-h-screen bg-[#0A0A0A]">
      <div className="flex justify-between items-center mb-8">
        <Button variant="secondary" onClick={() => router.back()} className="px-4 py-2">
          ← Back
        </Button>
        <h2 className="text-3xl font-bold text-white text-center flex-1">Vote Movies</h2>
        <div className="w-24" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-10 justify-items-center">
        {voteMovies.map((movie) => (
          <Card key={movie.id} className="bg-[#18181B] text-white w-full max-w-[320px] rounded-2xl shadow-lg border border-white/10 flex flex-col items-center">
            <CardContent className="flex flex-col items-center p-0 w-full">
              <div className="w-full h-[420px] flex items-center justify-center overflow-hidden rounded-t-2xl bg-neutral-900">
                <Image
                  src={movie.posterUrl}
                  alt={movie.title}
                  width={320}
                  height={420}
                  loading="lazy"
                  className="object-cover w-full h-full"
                />
              </div>
              <div className="flex flex-col items-center p-5 w-full">
                <CardTitle className="mb-1 text-center w-full line-clamp-1 text-lg font-semibold">{movie.title}</CardTitle>
                <CardDescription className="mb-4 text-center w-full text-white/70">{movie.genre} / {movie.year}</CardDescription>
                <div className="flex gap-3 mt-2 w-full justify-center">
                  <Button
                    variant={votes[movie.id] === 'yes' ? 'default' : 'secondary'}
                    onClick={() => handleVote(movie.id, 'yes')}
                    disabled={txStatus[movie.id] === 'pending' || !!votes[movie.id]}
                    className="flex-1"
                  >
                    Yes
                  </Button>
                  <Button
                    variant={votes[movie.id] === 'no' ? 'default' : 'secondary'}
                    onClick={() => handleVote(movie.id, 'no')}
                    disabled={txStatus[movie.id] === 'pending' || !!votes[movie.id]}
                    className="flex-1"
                  >
                    No
                  </Button>
                </div>
                {!!votes[movie.id] && (
                  <span className="text-blue-400 text-xs mt-3">You have already voted on this movie.</span>
                )}
                {txStatus[movie.id] === 'pending' && (
                  <span className="text-yellow-400 text-xs mt-3">Transaction pending...</span>
                )}
                {txStatus[movie.id] === 'success' && (
                  <span className="text-green-400 text-xs mt-3">Vote successful!</span>
                )}
                {txStatus[movie.id] === 'error' && (
                  <span className="text-red-400 text-xs mt-3">Transaction failed. Try again.</span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
} 