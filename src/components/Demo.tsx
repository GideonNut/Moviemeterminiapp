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
import { Navigation } from "./Navigation";

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
    <div
      style={{
        paddingTop: (context?.client.safeAreaInsets?.top ?? 0) + 64,
        paddingBottom: context?.client.safeAreaInsets?.bottom ?? 0,
        paddingLeft: context?.client.safeAreaInsets?.left ?? 0,
        paddingRight: context?.client.safeAreaInsets?.right ?? 0,
      }}
      className="min-h-screen bg-[#0A0A0A] text-white relative"
    >
      <Navigation />

      {/* Network Switch Button */}
      {isConnected && !isOnCelo && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-40">
          <div className="flex items-center gap-2 bg-[#1A1A1A] px-2 py-1 rounded-full border border-white/10 shadow-lg">
            <div className="flex items-center gap-1">
              <div className="w-1 h-1 rounded-full bg-yellow-500"></div>
              <span className="text-white/60 text-xs">Not connected to Celo</span>
            </div>
            <Button
              variant="secondary"
              onClick={handleSwitchToCelo}
              className="text-xs px-2 py-0.5"
            >
              Switch to Celo
            </Button>
          </div>
        </div>
      )}

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
            <div className="absolute right-0 mt-2 w-56 bg-[#1A1A1A] border border-white/10 rounded-xl shadow-xl p-4 text-sm text-white backdrop-blur-sm">
            {isConnected ? (
                <>
                  <div className="mb-2 font-semibold text-white/90">Profile</div>
                  <div className="mb-2 break-all text-xs text-white/60">{address}</div>
              <Button
                    variant="secondary"
                onClick={() => disconnect()}
              >
                Disconnect
              </Button>
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

