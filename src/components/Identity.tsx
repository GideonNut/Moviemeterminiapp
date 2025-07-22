"use client";

import { useEffect, useState } from "react";
import { useFrame } from "./providers/FrameProvider";
import { useAccount } from "wagmi";
import { truncateAddress } from "../lib/truncateAddress";
import Image from "next/image";
import { getFarcasterUser } from "../lib/farcaster";

export default function Identity() {
  const { context } = useFrame();
  const { address } = useAccount();
  const [movies, setMovies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [profilePic, setProfilePic] = useState<string | null>(null);

  // Fetch movies
  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const res = await fetch("/api/movies");
        const data = await res.json();
        if (data.success && Array.isArray(data.movies)) {
          setMovies(data.movies);
        }
      } catch (error) {
        setMovies([]);
      } finally {
        setLoading(false);
      }
    };
    fetchMovies();
  }, []);

  // Fetch Farcaster profile pic if not present in context
  useEffect(() => {
    async function fetchProfilePic() {
      if (!context?.user?.pfpUrl && context?.user?.fid) {
        const user = await getFarcasterUser(context.user.fid);
        if (user?.pfp) setProfilePic(user.pfp);
      } else if (context?.user?.pfpUrl) {
        setProfilePic(context.user.pfpUrl);
      }
    }
    fetchProfilePic();
  }, [context]);

  // Filter movies the user has voted on (if possible)
  // This is a placeholder: if votes are not tracked per user, show all movies with votes
  const votedMovies = movies.filter((movie) => {
    // If you track votes per user, filter by user here
    // For now, show movies with any votes
    return (movie.voteCountYes > 0 || movie.voteCountNo > 0);
  });

  return (
    <div className="bg-[#18181B] rounded-xl p-6 shadow-lg max-w-md mx-auto mt-8 text-white">
      <div className="flex items-center gap-4 mb-4">
        {profilePic ? (
          <Image
            src={profilePic}
            alt="Profile"
            width={56}
            height={56}
            className="rounded-full border border-white/20"
          />
        ) : (
          <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center text-2xl font-bold">
            {context?.user?.displayName?.[0] || "?"}
          </div>
        )}
        <div>
          <div className="font-semibold text-lg">
            {context?.user?.displayName || "Anonymous"}
          </div>
          {context?.user?.fid && (
            <div className="text-xs text-white/60">FID: {context.user.fid}</div>
          )}
          {address && (
            <div className="text-xs text-white/60">Wallet: {truncateAddress(address)}</div>
          )}
        </div>
      </div>
      <div>
        <div className="font-semibold mb-2">Movies Voted On</div>
        {loading ? (
          <div>Loading...</div>
        ) : votedMovies.length === 0 ? (
          <div className="text-white/60">No votes yet.</div>
        ) : (
          <ul className="space-y-2">
            {votedMovies.map((movie) => (
              <li key={movie._id || movie.id} className="flex items-center gap-2">
                {movie.posterUrl && (
                  <Image src={movie.posterUrl} alt={movie.title} width={32} height={48} className="rounded" />
                )}
                <span>{movie.title}</span>
                <span className="ml-auto text-xs text-white/40">Yes: {movie.voteCountYes} / No: {movie.voteCountNo}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
} 