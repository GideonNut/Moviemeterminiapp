"use client";

import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { Input } from "../components/ui/input";
import { signIn, signOut, getCsrfToken } from "next-auth/react";
import sdk, {
  SignIn as SignInCore,
} from "@farcaster/frame-sdk";
import {
  useAccount,
  useSendTransaction,
  useSignMessage,
  useSignTypedData,
  useWaitForTransactionReceipt,
  useDisconnect,
  useConnect,
  useSwitchChain,
  useChainId,
  useWriteContract,
} from "wagmi";

import { config } from "~/components/providers/WagmiProvider";
import { Button } from "~/components/ui/Button";
import { truncateAddress } from "~/lib/truncateAddress";
import { base, degen, mainnet, optimism, unichain } from "wagmi/chains";
import { BaseError, UserRejectedRequestError } from "viem";
import { useSession } from "next-auth/react";
import { Label } from "~/components/ui/label";
import { useFrame } from "~/components/providers/FrameProvider";
import type { Chain } from "wagmi/chains";
import { MovieCard } from "./MovieCard";
import Link from 'next/link';
import Image from 'next/image';

export const celo: Chain = {
  id: 42220,
  name: "Celo",
  nativeCurrency: {
    name: "Celo",
    symbol: "CELO",
    decimals: 18,
  },
  rpcUrls: {
    default: { http: ["https://forno.celo.org"] },
    public: { http: ["https://forno.celo.org"] },
  },
  blockExplorers: {
    default: { name: "CeloScan", url: "https://celoscan.io" },
  },
};

const MOVIE_CONTRACT_ADDRESS = "0x6d83eF793A7e82BFa20B57a60907F85c06fB8828";
const MOVIE_CONTRACT_ABI = [
  {
    "inputs": [
      { "internalType": "address", "name": "_rewardToken", "type": "address" }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "user", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }
    ],
    "name": "RewardSent",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "movieId", "type": "uint256" },
      { "indexed": false, "internalType": "address", "name": "voter", "type": "address" },
      { "indexed": false, "internalType": "bool", "name": "vote", "type": "bool" }
    ],
    "name": "Voted",
    "type": "event"
  },
  {
    "inputs": [
      { "internalType": "string", "name": "_title", "type": "string" }
    ],
    "name": "addMovie",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "movieCount",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "name": "movies",
    "outputs": [
      { "internalType": "uint256", "name": "id", "type": "uint256" },
      { "internalType": "string", "name": "title", "type": "string" },
      { "internalType": "uint256", "name": "yesVotes", "type": "uint256" },
      { "internalType": "uint256", "name": "noVotes", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      { "internalType": "address", "name": "", "type": "address" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "rewardAmount",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "rewardToken",
    "outputs": [
      { "internalType": "contract IERC20", "name": "", "type": "address" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "_amount", "type": "uint256" }
    ],
    "name": "setRewardAmount",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "_token", "type": "address" }
    ],
    "name": "setRewardToken",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "_movieId", "type": "uint256" },
      { "internalType": "bool", "name": "_vote", "type": "bool" }
    ],
    "name": "vote",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  { "stateMutability": "payable", "type": "receive" }
];

const SAMPLE_MOVIES = [
  {
    id: "1",
    title: "Final Destination: Bloodlines",
    description: "The next installment in the Final Destination franchise, continuing the story of death's design and those who try to escape it.",
    releaseYear: "2024",
    director: "Zach Lipovsky",
    genres: ["Horror", "Thriller"],
    rating: 7.2,
    posterUrl: "https://i.postimg.cc/W4LC67zd/photo-2025-05-19-09-19-58.jpg",
    voteCountYes: 0,
    voteCountNo: 0
  },
  {
    id: "2",
    title: "Inception",
    description: "A thief who steals corporate secrets through dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.",
    releaseYear: "2010",
    director: "Christopher Nolan",
    genres: ["Action", "Sci-Fi", "Thriller"],
    rating: 8.8,
    posterUrl: "https://i.postimg.cc/hPyRRxjj/IMG-8928.jpg",
    voteCountYes: 0,
    voteCountNo: 0
  },
  {
    id: "3",
    title: "Interstellar",
    description: "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival.",
    releaseYear: "2014",
    director: "Christopher Nolan",
    genres: ["Adventure", "Drama", "Sci-Fi"],
    rating: 8.6,
    posterUrl: "https://i.postimg.cc/k5nnn9CM/IMG-8929.jpg",
    voteCountYes: 0,
    voteCountNo: 0
  },
  {
    id: "4",
    title: "The Dark Knight",
    description: "When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.",
    releaseYear: "2008",
    director: "Christopher Nolan",
    genres: ["Action", "Crime", "Drama"],
    rating: 9.0,
    posterUrl: "https://i.postimg.cc/SKNfc24B/IMG-8930.jpg",
    voteCountYes: 0,
    voteCountNo: 0
  },
  {
    id: "5",
    title: "Dune: Part Two",
    description: "Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.",
    releaseYear: "2024",
    director: "Denis Villeneuve",
    genres: ["Action", "Adventure", "Drama"],
    rating: 8.7,
    posterUrl: "https://i.postimg.cc/HsRqZmnv/IMG-8931.jpg",
    voteCountYes: 0,
    voteCountNo: 0
  }
];

/* eslint-disable @typescript-eslint/no-unused-vars */
export function Demo(
  { title }: { title?: string } = { title: "Frames v2 Demo" }
) {
  const { isSDKLoaded, context, added, notificationDetails, lastEvent, addFrame, addFrameResult, openUrl, close } = useFrame();
  const [isContextOpen, setIsContextOpen] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [sendNotificationResult, setSendNotificationResult] = useState("");
  const [copied, setCopied] = useState(false);

  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const chainId = useChainId();
  const isOnCelo = chainId === 42220;

  const profileRef = useRef<HTMLDivElement>(null);
  const [showProfile, setShowProfile] = useState(false);

  const [movies, setMovies] = useState(SAMPLE_MOVIES);
  const [selectedMovieId, setSelectedMovieId] = useState<string | null>(null);
  const [showMovies, setShowMovies] = useState(false);

  useEffect(() => {
    console.log("isSDKLoaded", isSDKLoaded);
    console.log("context", context);
    console.log("address", address);
    console.log("isConnected", isConnected);
    console.log("chainId", chainId);
  }, [context, address, isConnected, chainId, isSDKLoaded]);

  useEffect(() => {
    // Auto-connect to Farcaster wallet when component mounts
    if (!isConnected && connectors) {
      // Find the Farcaster connector
      const farcasterConnector = connectors.find(connector => 
        connector.name.toLowerCase().includes('farcaster')
      );
      
      if (farcasterConnector) {
        connect({ connector: farcasterConnector });
      }
    }
  }, [isConnected, connect, connectors]);

  const {
    sendTransaction,
    error: sendTxError,
    isError: isSendTxError,
    isPending: isSendTxPending,
  } = useSendTransaction();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash: txHash as `0x${string}`,
    });

  const {
    signTypedData,
    error: signTypedError,
    isError: isSignTypedError,
    isPending: isSignTypedPending,
  } = useSignTypedData();

  const { disconnect } = useDisconnect();

  const {
    switchChain,
    error: switchChainError,
    isError: isSwitchChainError,
    isPending: isSwitchChainPending,
  } = useSwitchChain();

  const nextChain = useMemo(() => {
    if (chainId === base.id) {
      return optimism;
    } else if (chainId === optimism.id) {
      return degen;
    } else if (chainId === degen.id) {
      return mainnet;
    } else if (chainId === mainnet.id) {
      return unichain;
    } else {
      return base;
    }
  }, [chainId]);

  const handleSwitchChain = useCallback(() => {
    switchChain({ chainId: nextChain.id });
  }, [switchChain, nextChain.id]);

  const sendNotification = useCallback(async () => {
    setSendNotificationResult("");
    if (!notificationDetails || !context) {
      return;
    }

    try {
      const response = await fetch("/api/send-notification", {
        method: "POST",
        mode: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fid: context.user.fid,
          notificationDetails,
        }),
      });

      if (response.status === 200) {
        setSendNotificationResult("Success");
        return;
      } else if (response.status === 429) {
        setSendNotificationResult("Rate limited");
        return;
      }

      const data = await response.text();
      setSendNotificationResult(`Error: ${data}`);
    } catch (error) {
      setSendNotificationResult(`Error: ${error}`);
    }
  }, [context, notificationDetails]);

  const sendTx = useCallback(() => {
    sendTransaction(
      {
        // call yoink() on Yoink contract
        to: "0x4bBFD120d9f352A0BEd7a014bd67913a2007a878",
        data: "0x9846cd9efc000023c0",
      },
      {
        onSuccess: (hash) => {
          setTxHash(hash);
        },
      }
    );
  }, [sendTransaction]);

  const signTyped = useCallback(() => {
    signTypedData({
      domain: {
        name: "Frames v2 Demo",
        version: "1",
        chainId,
      },
      types: {
        Message: [{ name: "content", type: "string" }],
      },
      message: {
        content: "Hello from Frames v2!",
      },
      primaryType: "Message",
    });
  }, [chainId, signTypedData]);

  const toggleContext = useCallback(() => {
    setIsContextOpen((prev) => !prev);
  }, []);

  // Voting logic
  const [voteStatus, setVoteStatus] = useState<string | null>(null);
  const [voteError, setVoteError] = useState<string | null>(null);
  const { writeContractAsync, isPending: isVotePending } = useWriteContract();

  const handleMovieVote = async (movieId: string, vote: boolean) => {
    setVoteStatus(null);
    setVoteError(null);
    
    if (!isConnected) {
      setVoteError("Please connect your wallet first");
      return;
    }

    if (!isOnCelo) {
      setVoteError("Please switch to Celo network");
      return;
    }

    try {
      setVoteStatus("Waiting for user to confirm...");
      const result = await writeContractAsync({
        address: MOVIE_CONTRACT_ADDRESS as `0x${string}`,
        abi: MOVIE_CONTRACT_ABI,
        functionName: "vote",
        args: [BigInt(movieId), vote],
        chainId: 42220,
      });
      
      setVoteStatus("Vote submitted!");
      
      // Update local state
      setMovies(prevMovies => 
        prevMovies.map(movie => 
          movie.id === movieId 
            ? {
                ...movie,
                voteCountYes: vote ? (movie.voteCountYes || 0) + 1 : movie.voteCountYes,
                voteCountNo: !vote ? (movie.voteCountNo || 0) + 1 : movie.voteCountNo
              }
            : movie
        )
      );
    } catch (err: any) {
      console.error("Voting error:", err);
      setVoteError(err.message || "Error submitting vote");
    }
  };

  const handleSwitchToCelo = async () => {
    try {
      await switchChain({ 
        chainId: 42220
      });
    } catch (error) {
      console.error("Error switching to Celo:", error);
      // If the chain is not added to the wallet, we need to add it first
      if (error instanceof Error && error.message.includes("chain not configured")) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0xA4EC', // 42220 in hex
              chainName: 'Celo',
              nativeCurrency: {
                name: 'CELO',
                symbol: 'CELO',
                decimals: 18
              },
              rpcUrls: ['https://forno.celo.org'],
              blockExplorerUrls: ['https://celoscan.io']
            }]
          });
        } catch (addError) {
          console.error("Error adding Celo chain:", addError);
        }
      }
    }
  };

  if (!isSDKLoaded) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0A0A0A] border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link href="/" className="text-white text-xl font-bold flex items-center">
                <div className="w-32 h-8 relative">
                  <Image
                    src="/logo2.png"
                    alt="MovieMetter Logo"
                    layout="fill"
                    objectFit="contain"
                  />
                </div>
              </Link>
              <Link
                href="/rewards"
                className="px-4 py-2 rounded-md text-base font-medium border-2 border-transparent transition-colors duration-200 text-white hover:bg-white/10"
              >
                Rewards
              </Link>
            </div>
          </div>
        </div>
      </nav>
      <div
        className="min-h-screen bg-[#0A0A0A] text-white relative"
      >
        {/* User Profile Avatar */}
        <div className="absolute top-4 right-4 z-50">
          <div
            ref={profileRef}
            className="relative"
            onMouseEnter={() => setShowProfile(true)}
            onMouseLeave={() => setShowProfile(false)}
          >
            {isConnected ? (
              <div className="w-10 h-10 bg-white text-black flex items-center justify-center rounded-full font-bold cursor-pointer border border-white/20 shadow-lg overflow-hidden">
                {context?.user?.pfpUrl ? (
                  <img 
                    src={context.user.pfpUrl} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  address?.slice(2, 3).toUpperCase()
                )}
              </div>
            ) : (
              <div className="w-10 h-10 bg-white/10 text-white flex items-center justify-center rounded-full border border-white/20 shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118A7.5 7.5 0 0112 15.75a7.5 7.5 0 017.5 4.368" />
                </svg>
              </div>
            )}
            {/* Profile Dropdown */}
            {showProfile && (
              <div className="absolute right-0 mt-2 w-72 bg-[#1A1A1A] border border-white/10 rounded-xl shadow-xl p-4 text-sm text-white backdrop-blur-sm">
                {isConnected ? (
                  <>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-full overflow-hidden border border-white/20">
                        {context?.user?.pfpUrl ? (
                          <img 
                            src={context.user.pfpUrl} 
                            alt="Profile" 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-white/10 flex items-center justify-center text-lg font-bold">
                            {address?.slice(2, 3).toUpperCase()}
            </div>
          )}
        </div>
        <div>
                        <div className="font-semibold text-white/90">
                          {context?.user?.displayName || 'Anonymous User'}
                        </div>
                        <div className="text-xs text-white/60 break-all">
                          {address}
                        </div>
            </div>
          </div>

                    {/* Stats Section */}
                    <div className="grid grid-cols-3 gap-4 mb-4 p-3 bg-white/5 rounded-lg">
                      <div>
                        <div className="text-xs text-white/60">Movies Voted</div>
                        <div className="text-lg font-semibold">
                          {movies.filter(m => m.voteCountYes > 0 || m.voteCountNo > 0).length}
            </div>
          </div>
                      <div>
                        <div className="text-xs text-white/60">Network</div>
                        <div className="text-lg font-semibold">
                          {isOnCelo ? 'Celo' : 'Not on Celo'}
            </div>
          </div>
                      <div>
                        <div className="text-xs text-white/60">Voting Streak</div>
                        <div className="text-lg font-semibold flex items-center gap-1">
                          <span>🔥</span>
                          <span>3</span>
            </div>
          </div>
        </div>

                    {/* Streak Progress */}
        <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xs font-semibold text-white/60">Streak Progress</div>
                        <div className="text-xs text-white/60">3/7 days</div>
                      </div>
                      <div className="w-full bg-white/5 rounded-full h-1.5">
                        <div 
                          className="bg-gradient-to-r from-yellow-500 to-orange-500 h-1.5 rounded-full" 
                          style={{ width: '42%' }}
                        ></div>
                      </div>
                      <div className="mt-2 text-xs text-white/60">
                        Vote for 4 more days to get a bonus reward!
          </div>
        </div>

                    {/* Recent Votes */}
          <div className="mb-4">
                      <div className="text-xs font-semibold text-white/60 mb-2">Recent Votes</div>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {movies
                          .filter(m => m.voteCountYes > 0 || m.voteCountNo > 0)
                          .slice(0, 3)
                          .map(movie => (
                            <div key={movie.id} className="flex items-center gap-2 p-2 bg-white/5 rounded-lg">
                              <div className="w-8 h-8 rounded overflow-hidden">
                                <img 
                                  src={movie.posterUrl} 
                                  alt={movie.title}
                                  className="w-full h-full object-cover"
                                />
            </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-medium truncate">{movie.title}</div>
                                <div className="text-xs text-white/60">
                                  {movie.voteCountYes > 0 ? '👍 Voted Yes' : '👎 Voted No'}
              </div>
          </div>
            </div>
                          ))}
                        {movies.filter(m => m.voteCountYes > 0 || m.voteCountNo > 0).length === 0 && (
                          <div className="text-xs text-white/60 p-2">No votes yet</div>
                        )}
          </div>
        </div>

                    <div className="flex gap-2">
              <Button
                        variant="secondary"
                onClick={() => disconnect()}
                        className="flex-1"
              >
                Disconnect
              </Button>
              <Button
                        variant="secondary"
                        onClick={() => window.open('https://celoscan.io/address/' + address, '_blank')}
                        className="flex-1"
              >
                        View on CeloScan
              </Button>
                    </div>
                  </>
                ) : (
                  <div className="text-white/60 text-sm">Connecting...</div>
                )}
              </div>
            )}
          </div>
          </div>

        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <h1 className="text-3xl font-bold text-center mb-8 text-white tracking-tight">{title}</h1>

          {/* Hero Section with Text */}
          <div className="text-center mb-12">
            {/* Network Switch Button */}
            {isConnected && !isOnCelo && (
              <div className="flex justify-center mb-6">
                <button
                  onClick={handleSwitchToCelo}
                  className="bg-[#1A1A1A] hover:bg-white/10 text-white font-medium px-4 py-2 rounded-lg border border-white/10 transition-colors duration-200 flex items-center gap-2"
                >
                  <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                  <span>Switch to Celo</span>
                </button>
              </div>
            )}

            <h2 className="text-4xl md:text-5xl font-bold text-white mb-8 tracking-tight">
              Discover Movies, Share your taste and be rewarded
            </h2>

            {/* How it Works Section */}
            <div className="max-w-3xl mx-auto mb-12">
              <h3 className="text-2xl font-semibold text-white mb-6">How it works</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#1A1A1A] p-6 rounded-xl border border-white/10">
                  <div className="text-2xl mb-3">🎬</div>
                  <h4 className="text-lg font-medium text-white mb-2">Discover Movies</h4>
                  <p className="text-white/60 text-sm">Browse through our curated collection of movies and find your next favorite film.</p>
                </div>
                <div className="bg-[#1A1A1A] p-6 rounded-xl border border-white/10">
                  <div className="text-2xl mb-3">👍</div>
                  <h4 className="text-lg font-medium text-white mb-2">Vote & Share</h4>
                  <p className="text-white/60 text-sm">Vote yes or no on movies and share your opinions with the community.</p>
                </div>
                <div className="bg-[#1A1A1A] p-6 rounded-xl border border-white/10">
                  <div className="text-2xl mb-3">🎁</div>
                  <h4 className="text-lg font-medium text-white mb-2">Earn Rewards</h4>
                  <p className="text-white/60 text-sm">Get rewarded with cUSD and GoodDollar tokens for your participation.</p>
                </div>
              </div>
            </div>

            {/* Explore Button */}
                <Button
              variant="primary"
              onClick={() => setShowMovies(true)}
              className="text-lg px-8 py-4"
            >
              Explore Movies
                </Button>
          </div>

          {/* Movies Grid - Only shown when showMovies is true */}
          {showMovies && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {movies.map((movie) => (
                <MovieCard
                  key={movie.id}
                  movie={movie}
                  onVote={(vote) => handleMovieVote(movie.id, vote)}
                  isVoting={isVotePending}
                  isConnected={isConnected}
                />
              ))}
              </div>
          )}
        </div>
      </div>
    </div>
  );
}
/* eslint-enable @typescript-eslint/no-unused-vars */

function SignMessage() {
  const { isConnected } = useAccount();
  const { connectAsync } = useConnect();
  const {
    signMessage,
    data: signature,
    error: signError,
    isError: isSignError,
    isPending: isSignPending,
  } = useSignMessage();

  const handleSignMessage = useCallback(async () => {
    if (!isConnected) {
      await connectAsync({
        chainId: base.id,
        connector: config.connectors[0],
      });
    }

    signMessage({ message: "Hello from Frames v2!" });
  }, [connectAsync, isConnected, signMessage]);

  return (
    <>
      <Button
        onClick={handleSignMessage}
        disabled={isSignPending}
        isLoading={isSignPending}
      >
        Sign Message
      </Button>
      {isSignError && renderError(signError)}
      {signature && (
        <div className="mt-2 text-xs">
          <div>Signature: {signature}</div>
        </div>
      )}
    </>
  );
}

function SendEth() {
  const { isConnected, chainId } = useAccount();
  const {
    sendTransaction,
    data,
    error: sendTxError,
    isError: isSendTxError,
    isPending: isSendTxPending,
  } = useSendTransaction();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash: data,
    });

  const toAddr = useMemo(() => {
    // Protocol guild address
    return chainId === base.id
      ? "0x32e3C7fD24e175701A35c224f2238d18439C7dBC"
      : "0xB3d8d7887693a9852734b4D25e9C0Bb35Ba8a830";
  }, [chainId]);

  const handleSend = useCallback(() => {
    sendTransaction({
      to: toAddr,
      value: 1n,
    });
  }, [toAddr, sendTransaction]);

  return (
    <>
      <Button
        onClick={handleSend}
        disabled={!isConnected || isSendTxPending}
        isLoading={isSendTxPending}
      >
        Send Transaction (eth)
      </Button>
      {isSendTxError && renderError(sendTxError)}
      {data && (
        <div className="mt-2 text-xs">
          <div>Hash: {truncateAddress(data)}</div>
          <div>
            Status:{" "}
            {isConfirming
              ? "Confirming..."
              : isConfirmed
              ? "Confirmed!"
              : "Pending"}
          </div>
        </div>
      )}
    </>
  );
}

function SignIn() {
  const [signingIn, setSigningIn] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [signInResult, setSignInResult] = useState<SignInCore.SignInResult>();
  const [signInFailure, setSignInFailure] = useState<string>();
  const { data: session, status } = useSession();

  const getNonce = useCallback(async () => {
    const nonce = await getCsrfToken();
    if (!nonce) throw new Error("Unable to generate nonce");
    return nonce;
  }, []);

  const handleSignIn = useCallback(async () => {
    try {
      setSigningIn(true);
      setSignInFailure(undefined);
      const nonce = await getNonce();
      const result = await sdk.actions.signIn({ nonce });
      setSignInResult(result);

      await signIn("credentials", {
        message: result.message,
        signature: result.signature,
        redirect: false,
      });
    } catch (e) {
      if (e instanceof SignInCore.RejectedByUser) {
        setSignInFailure("Rejected by user");
        return;
      }

      setSignInFailure("Unknown error");
    } finally {
      setSigningIn(false);
    }
  }, [getNonce]);

  const handleSignOut = useCallback(async () => {
    try {
      setSigningOut(true);
      await signOut({ redirect: false });
      setSignInResult(undefined);
    } finally {
      setSigningOut(false);
    }
  }, []);

  return (
    <>
      {status !== "authenticated" && (
        <Button onClick={handleSignIn} disabled={signingIn}>
          Sign In with Farcaster
        </Button>
      )}
      {status === "authenticated" && (
        <Button onClick={handleSignOut} disabled={signingOut}>
          Sign out
        </Button>
      )}
      {session && (
        <div className="my-2 p-2 text-xs overflow-x-scroll bg-gray-100 rounded-lg font-mono">
          <div className="font-semibold text-gray-500 mb-1">Session</div>
          <div className="whitespace-pre">
            {JSON.stringify(session, null, 2)}
          </div>
        </div>
      )}
      {signInFailure && !signingIn && (
        <div className="my-2 p-2 text-xs overflow-x-scroll bg-gray-100 rounded-lg font-mono">
          <div className="font-semibold text-gray-500 mb-1">SIWF Result</div>
          <div className="whitespace-pre">{signInFailure}</div>
        </div>
      )}
      {signInResult && !signingIn && (
        <div className="my-2 p-2 text-xs overflow-x-scroll bg-gray-100 rounded-lg font-mono">
          <div className="font-semibold text-gray-500 mb-1">SIWF Result</div>
          <div className="whitespace-pre">
            {JSON.stringify(signInResult, null, 2)}
          </div>
        </div>
      )}
    </>
  );
}

function ViewProfile() {
  const [fid, setFid] = useState("3");

  return (
    <>
      <div>
        <Label
          className="text-xs font-semibold text-gray-500 mb-1"
          htmlFor="view-profile-fid"
        >
          Fid
        </Label>
        <Input
          id="view-profile-fid"
          type="number"
          value={fid}
          className="mb-2"
          onChange={(e) => {
            setFid(e.target.value);
          }}
          step="1"
          min="1"
        />
      </div>
      <Button
        onClick={() => {
          sdk.actions.viewProfile({ fid: parseInt(fid) });
        }}
      >
        View Profile
      </Button>
    </>
  );
}

const renderError = (error: Error | null) => {
  if (!error) return null;
  if (error instanceof BaseError) {
    const isUserRejection = error.walk(
      (e) => e instanceof UserRejectedRequestError
    );

    if (isUserRejection) {
      return <div className="text-red-500 text-xs mt-1">Rejected by user.</div>;
    }
  }

  return <div className="text-red-500 text-xs mt-1">{error.message}</div>;
};

