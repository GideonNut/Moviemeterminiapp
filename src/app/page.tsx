"use client";

import { MovieCard, CompactMovieCard } from "~/components/MovieCard";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/Button";
import { Home, Film, Tv, Gift } from "lucide-react";
import trailersData from "../data/trailers.json";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "~/components/ui/carousel";
import Header from "~/components/Header";
import { VOTE_CONTRACT_ADDRESS, VOTE_CONTRACT_ABI } from "~/constants/voteContract";
import { useAccount, useChainId, useSwitchChain, useWriteContract, useBalance, useWalletClient } from "wagmi";
import { encodeFunctionData } from "viem";
import { getDataSuffix, submitReferral } from "@divvi/referral-sdk";

export default function DiscoverPage() {
  const [isVoting, setIsVoting] = useState(false);
  const [votingMovies, setVotingMovies] = useState<Set<string>>(new Set());
  const [isConnected, setIsConnected] = useState(false);
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentVotingId, setCurrentVotingId] = useState<string | null>(null);
  const [currentVoteType, setCurrentVoteType] = useState<'yes' | 'no' | null>(null);
  const [votes, setVotes] = useState<{ [id: string]: 'yes' | 'no' | null }>({});
  const [referralTag, setReferralTag] = useState<string | null>(null);
  
  // Add state for trailers
  type Trailer = { id: string; title: string; genre: string; year: string; youtubeId: string };
  const [trailers, setTrailers] = useState<Trailer[]>([]);
  // Add state for modal
  const [openTrailer, setOpenTrailer] = useState<null | { title: string; youtubeId: string }>(null);

  // Wagmi hooks for blockchain interaction
  const { address, isConnected: wagmiConnected } = useAccount();
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
    if (wagmiConnected && currentChainId !== 42220 && currentChainId !== 44787) {
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
  }, [wagmiConnected, currentChainId, switchChainAsync]);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        // Use Wagmi connection status
        setIsConnected(wagmiConnected);
      } catch (error) {
        console.error('Error checking connection:', error);
        setIsConnected(false);
      }
    };
    checkConnection();
  }, [wagmiConnected]);

  // Prepare Divvi referral tag once wallet is connected
  useEffect(() => {
    if (wagmiConnected && address) {
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
  }, [wagmiConnected, address]);

  useEffect(() => {
    const fetchMovies = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/movies");
        const data = await res.json();
        if (data.success && Array.isArray(data.movies)) {
          setMovies(data.movies);
        }
      } catch (error) {
        console.error('Error fetching movies:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchMovies();
  }, []);

  useEffect(() => {
    // Load trailers from JSON (static import)
    setTrailers(trailersData);
  }, []);

  // Fetch user's previous votes from MongoDB
  const fetchUserVotes = async () => {
    if (!wagmiConnected || !address) return;
    
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

  // Fetch user votes when wallet connects
  useEffect(() => {
    if (wagmiConnected && address) {
      fetchUserVotes();
    }
  }, [wagmiConnected, address]);

  // Handle transaction state changes
  useEffect(() => {
    if (hash && currentVotingId) {
      // Transaction was sent successfully
      console.log('Transaction hash:', hash);
      
      // Save vote to MongoDB
      if (address && currentVotingId && currentVoteType) {
        fetch('/api/movies', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'vote',
            id: currentVotingId,
            type: currentVoteType,
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
        });
      }
      
      // Clear the current voting ID and vote type
      setCurrentVotingId(null);
      setCurrentVoteType(null);
      
      // Refresh movies to get updated vote counts
      setTimeout(() => {
        fetch("/api/movies").then(res => res.json()).then(data => {
          if (data.success && Array.isArray(data.movies)) {
            setMovies(data.movies);
          }
        });
      }, 1000);
    }
  }, [hash, currentVotingId, currentVoteType, address]);

  // Handle errors from the contract
  useEffect(() => {
    if (error && currentVotingId) {
      console.error('Contract error:', error);
      
      // Revert the vote if the contract call failed
      setVotes((prev) => ({ ...prev, [currentVotingId]: null }));
      
      // Clear the current voting ID
      setCurrentVotingId(null);
      setCurrentVoteType(null);
      
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
      
      alert(errorMessage);
    }
  }, [error, currentVotingId]);

  const handleVote = async (movieId: string, vote: 'yes' | 'no') => {
    console.log('Main page: handleVote called with:', movieId, vote);
    
    if (votes[movieId]) return;
    
    if (!wagmiConnected || !address) {
      alert('Please connect your wallet to vote');
      return;
    }
    
    // Check if we're on a Celo network
    if (currentChainId !== 42220 && currentChainId !== 44787) {
      alert('Please switch to a Celo network (testnet or mainnet) before voting.');
      return;
    }
    
    // Set individual movie voting state
    setVotingMovies(prev => new Set(prev).add(movieId));
    setCurrentVotingId(movieId);
    setCurrentVoteType(vote);
    
    // Set the vote immediately to prevent double-clicking
    setVotes((prev) => ({ ...prev, [movieId]: vote }));
    
    try {
      const movieIdBigInt = BigInt(parseInt(movieId, 10));
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

      // Persist vote to MongoDB like before
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

      // Clear voting flags and refresh movies
      setCurrentVotingId(null);
      setCurrentVoteType(null);
      setTimeout(() => {
        fetch("/api/movies").then(res => res.json()).then(data => {
          if (data.success && Array.isArray(data.movies)) {
            setMovies(data.movies);
          }
        });
      }, 1000);

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
      
      setCurrentVotingId(null);
      setCurrentVoteType(null);
      alert(errorMessage);
    } finally {
      // Clear individual movie voting state
      setVotingMovies(prev => {
        const newSet = new Set(prev);
        newSet.delete(movieId);
        return newSet;
      });
    }
  };

  const handleSearch = (query: string) => {
    // Handle search logic here
    console.log('Searching for:', query);
  };

  const filteredMovies = movies.filter((movie: any) =>
    movie.title.toLowerCase().includes(search.toLowerCase()) ||
    (movie.genres && movie.genres.some((g: string) => g.toLowerCase().includes(search.toLowerCase())))
  );

  return (
    <div className="min-h-screen relative bg-[#0A0A0A] pb-10 overflow-x-hidden">

   
 
      {/* Top Header */}
      <Header showSearch={true} onSearch={handleSearch} movies={movies} />

      {/* Main Content */}
      <main className="pt-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Newest Trailers */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-3">Newest Trailers</h2>
          <div className="relative">
            <Carousel className="w-full">
              <CarouselContent className="-ml-2 md:-ml-4">
                {trailers.length === 0 ? (
                  <div className="text-center text-white w-full text-sm">No trailers found.</div>
                ) : (
                  trailers.map((trailer: any) => (
                    <CarouselItem key={trailer.id} className="pl-2 md:pl-4 basis-[280px] md:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                      <Card className="bg-[#18181B] text-white cursor-pointer" onClick={() => setOpenTrailer({ title: trailer.title, youtubeId: trailer.youtubeId })}>
                        <CardContent className="flex flex-col items-center p-3">
                          <div className="w-full h-36 mb-2 flex items-center justify-center overflow-hidden rounded">
                            <Image
                              src={
                                trailer.title === "Dune: Part Two"
                                  ? "https://i.postimg.cc/tg8JzJ5J/dune-2.jpg"
                                  : trailer.title === "Deadpool & Wolverine"
                                  ? "https://i.postimg.cc/j2whFDV1/deadpool.jpg"
                                  : trailer.title === "Kingdom of the Planet of the Apes"
                                  ? "https://i.postimg.cc/4xQN9wK8/KINGDOM.jpg"
                                  : `https://img.youtube.com/vi/${trailer.youtubeId}/hqdefault.jpg`
                            }
                            alt={trailer.title}
                            width={320}
                            height={180}
                            className="object-cover w-full h-full"
                          />
                        </div>
                        <CardTitle className="mb-1 text-center w-full line-clamp-1 text-sm font-medium">{trailer.title}</CardTitle>
                        <CardDescription className="mb-2 text-center w-full text-xs text-white/70">{trailer.genre} / {trailer.year}</CardDescription>
                        <Button className="w-full text-xs py-1.5" variant="secondary" onClick={e => { e.stopPropagation(); setOpenTrailer({ title: trailer.title, youtubeId: trailer.youtubeId }); }}>
                          Watch Trailer
                        </Button>
                      </CardContent>
                    </Card>
                  </CarouselItem>
                ))
              )}
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex -left-4" />
            <CarouselNext className="hidden md:flex -right-4" />
          </Carousel>
        </div>
        {/* Trailer Modal */}
        {openTrailer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
            <div className="bg-[#18181B] rounded-lg shadow-lg p-4 max-w-xl w-full relative">
              <button
                className="absolute top-2 right-2 text-white text-xl font-bold hover:text-red-400"
                onClick={() => setOpenTrailer(null)}
                aria-label="Close"
              >
                ×
              </button>
              <h3 className="text-base font-semibold text-white mb-3 text-center pr-6">{openTrailer.title}</h3>
              <div className="aspect-video w-full">
                <iframe
                  width="100%"
                  height="315"
                  src={`https://www.youtube.com/embed/${openTrailer.youtubeId}?autoplay=1`}
                  title={openTrailer.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Recently Added Movies */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-white mb-3">Recently Added Movies</h2>
        <div className="relative">
          <Carousel className="w-full">
            <CarouselContent className="-ml-2 md:-ml-4">
              {loading ? (
                <div className="text-center text-white w-full text-sm py-8">Loading movies...</div>
              ) : filteredMovies.length === 0 ? (
                <div className="text-center text-white w-full text-sm py-8">No movies found.</div>
              ) : (
                filteredMovies.slice(4, 8).map((movie: any) => (
                  <CarouselItem key={movie.id || movie._id} className="pl-2 md:pl-4 basis-[280px] md:basis-[320px] lg:basis-[360px]">
                    <div className="flex justify-center">
                      <CompactMovieCard
                        movie={movie}
                        onVote={(vote) => {
                          console.log('CompactMovieCard onVote callback called with:', vote);
                          handleVote(movie.id || movie._id, vote ? 'yes' : 'no');
                        }}
                        isVoting={currentVotingId === (movie.id || movie._id) || isPending}
                        isConnected={wagmiConnected}
                        userVotes={votes}
                      />
                    </div>
                  </CarouselItem>
                ))
              )}
            </CarouselContent>
            <CarouselPrevious className="flex -left-4" />
            <CarouselNext className="flex -right-4" />
          </Carousel>
        </div>
      </section>

      {/* Trending Movies & TV Shows */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-white mb-3">Trending Movies & TV Shows</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {loading ? (
            <div className="col-span-4 text-center text-white text-sm py-8">Loading movies...</div>
          ) : filteredMovies.length === 0 ? (
            <div className="col-span-4 text-center text-white text-sm py-8">No movies found.</div>
          ) : (
            filteredMovies.slice(8, 12).map((movie: any) => (
              <MovieCard
                key={movie.id || movie._id}
                movie={movie}
                onVote={(vote) => handleVote(movie.id || movie._id, vote ? 'yes' : 'no')}
                isVoting={currentVotingId === (movie.id || movie._id) || isPending}
                isConnected={wagmiConnected}
                userVotes={votes}
              />
            ))
          )}
        </div>
      </section>

      {/* Newest Reviews */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-white mb-3">Newest Reviews</h2>
        <div className="flex justify-center items-center min-h-[80px]">
          <span className="text-white/60 text-sm">There are no reviews at this time.</span>
        </div>
      </section>

      {/* Trending Celebrities */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-white mb-3">Trending Celebrities</h2>
        <div className="flex justify-center items-center min-h-[80px]">
          <span className="text-white/60 text-sm">There are no trending celebrities at this time.</span>
        </div>
      </section>
    </main>

    {/* Bottom Navigation */}
  
  </div>
  );
}
