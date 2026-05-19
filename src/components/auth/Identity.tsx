"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { truncateAddress } from "~/lib/truncateAddress";
import Image from "next/image";

export default function Identity() {
  const { address } = useAccount();
  const [movies, setMovies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const res = await fetch("/api/movies");
        const data = await res.json();
        if (data.success && Array.isArray(data.movies)) {
          setMovies(data.movies);
        }
      } catch {
        setMovies([]);
      } finally {
        setLoading(false);
      }
    };
    fetchMovies();
  }, []);

  const votedMovies = movies.filter(
    (m) => m.voteCountYes > 0 || m.voteCountNo > 0
  );

  return (
    <div className="bg-[#18181B] rounded-xl p-6 shadow-lg max-w-md mx-auto mt-8 text-white">
      <div className="flex items-center gap-4 mb-4">
        {/* Avatar placeholder */}
        <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center text-2xl font-bold">
          {address ? address.slice(2, 4).toUpperCase() : "?"}
        </div>
        <div>
          <div className="font-semibold text-lg">
            {address ? truncateAddress(address) : "Not connected"}
          </div>
          <div className="text-xs text-white/60">MiniPay Wallet</div>
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
                  <Image
                    src={movie.posterUrl}
                    alt={movie.title}
                    width={32}
                    height={48}
                    className="rounded"
                  />
                )}
                <span>{movie.title}</span>
                <span className="ml-auto text-xs text-white/40">
                  Yes: {movie.voteCountYes} / No: {movie.voteCountNo}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}