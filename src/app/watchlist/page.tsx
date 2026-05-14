"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import Header from "~/components/navigation/Header";
import { useAccount } from "wagmi";
import { ensureFullPosterUrl } from "~/lib/images/utils";
import {
  IconBookmark,
  IconX,
  IconLoader2,
  IconMovie,
  IconLogin,
  IconArrowRight,
} from "@tabler/icons-react";

interface Movie {
  id: string;
  title: string;
  description: string;
  posterUrl?: string;
  releaseYear?: string;
  genres?: string[];
  votes: { yes: number; no: number };
  createdAt: string;
  updatedAt: string;
}

export default function WatchlistPage() {
  const { address, isConnected } = useAccount();
  const [watchlist, setWatchlist] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);

  const fetchWatchlist = async () => {
    if (!isConnected || !address) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/watchlist?address=${address}`);
      if (res.ok) setWatchlist(await res.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const remove = async (movieId: string) => {
    if (!address) return;
    try {
      setRemoving(movieId);
      const res = await fetch(`/api/watchlist?address=${address}&movieId=${movieId}`, { method: "DELETE" });
      if (res.ok) setWatchlist(prev => prev.filter(m => m.id !== movieId));
    } catch (e) { console.error(e); }
    finally { setRemoving(null); }
  };

  useEffect(() => {
    if (isConnected && address) fetchWatchlist();
    else setLoading(false);
  }, [isConnected, address]);

  // ── Not connected ──
  if (!isConnected) return (
    <div className="min-h-screen bg-black">
      <Header showSearch={false} />
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-6 text-center">
        <div className="w-14 h-14 rounded-full bg-white/[0.05] border border-white/[0.08] flex items-center justify-center mb-1">
          <IconLogin size={22} className="text-white/25" />
        </div>
        <h2 className="text-white text-base font-semibold">No wallet connected</h2>
        <p className="text-white/30 text-sm max-w-[240px] leading-relaxed">Open MovieMeter inside MiniPay to view your watchlist</p>
      </div>
    </div>
  );

  // ── Loading ──
  if (loading) return (
    <div className="min-h-screen bg-black">
      <Header showSearch={false} />
      <div className="px-5 pt-[80px] max-w-lg mx-auto">
        <div className="h-[1px] w-full bg-white/6 mb-6" />
        <div className="h-6 w-24 bg-white/8 rounded-full mb-6 animate-pulse" />
        {[1,2,3,4].map(i => (
          <div key={i} className="flex gap-3 mb-3 rounded-xl bg-white/[0.03] p-3 animate-pulse">
            <div className="w-[68px] h-24 rounded-lg bg-white/8 flex-shrink-0" />
            <div className="flex-1 space-y-2 py-1">
              <div className="h-3.5 w-3/4 bg-white/8 rounded" />
              <div className="h-2.5 w-1/2 bg-white/5 rounded" />
              <div className="h-2.5 w-full bg-white/5 rounded" />
              <div className="h-2.5 w-4/5 bg-white/5 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black">
      <Header showSearch={false} />

      <div className="px-5 pt-[80px] pb-16 max-w-lg mx-auto">
        <div className="h-[1px] w-full bg-white/6 mb-6" />

        {/* Title */}
        <div className="mb-6">
          <p className="text-white/30 text-[11px] font-semibold uppercase tracking-[0.12em] mb-1">Saved films</p>
          <div className="flex items-end justify-between">
            <h1 className="text-white text-2xl font-bold tracking-tight leading-none">Watchlist</h1>
            {watchlist.length > 0 && (
              <span className="text-white/25 text-xs">{watchlist.length} film{watchlist.length !== 1 ? "s" : ""}</span>
            )}
          </div>
        </div>

        {/* Empty */}
        {watchlist.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <div className="w-14 h-14 rounded-full bg-white/[0.04] border border-white/[0.07] flex items-center justify-center">
              <IconBookmark size={22} className="text-white/20" />
            </div>
            <div>
              <h3 className="text-white text-sm font-semibold mb-1">Nothing saved yet</h3>
              <p className="text-white/30 text-xs leading-relaxed max-w-[200px] mx-auto">Bookmark any movie while swiping to save it here</p>
            </div>
            <Link href="/">
              <button className="flex items-center gap-1.5 mt-1 px-4 py-2 rounded-full bg-white text-black text-[13px] font-semibold hover:opacity-90 transition-opacity">
                Browse movies <IconArrowRight size={13} stroke={2.5} />
              </button>
            </Link>
          </div>
        ) : (
          <div className="space-y-2.5">
            {watchlist.map(movie => (
              <div
                key={movie.id}
                className="group flex gap-3 rounded-xl bg-white/[0.03] border border-white/[0.07] p-3 hover:bg-white/[0.06] transition-colors"
              >
                {/* Poster */}
                <div className="w-[68px] h-24 rounded-lg bg-white/8 flex-shrink-0 overflow-hidden relative">
                  {movie.posterUrl ? (
                    <Image
                      src={ensureFullPosterUrl(movie.posterUrl) || ""}
                      alt={movie.title}
                      fill
                      className="object-cover"
                      sizes="68px"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <IconMovie size={20} className="text-white/15" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                  <div>
                    <h3 className="text-white font-semibold text-[13px] leading-snug line-clamp-1 tracking-tight">{movie.title}</h3>
                    <p className="text-white/30 text-[11px] mt-0.5">
                      {movie.genres?.[0] ?? ""}{movie.releaseYear ? ` · ${movie.releaseYear}` : ""}
                    </p>
                    <p className="text-white/40 text-[11px] mt-2 line-clamp-2 leading-relaxed">
                      {movie.description || "No description available"}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 mt-2.5">
                    <Link href={`/movies/${movie.id}`} className="flex-1">
                      <button className="w-full py-2 rounded-lg bg-white/8 hover:bg-white/14 text-white text-xs font-medium transition-colors">
                        View details
                      </button>
                    </Link>
                    <button
                      onClick={() => remove(movie.id)}
                      disabled={removing === movie.id}
                      className="w-8 h-8 rounded-lg bg-white/5 hover:bg-red-500/15 flex items-center justify-center text-white/30 hover:text-red-400 transition-colors"
                    >
                      {removing === movie.id
                        ? <IconLoader2 size={13} className="animate-spin" />
                        : <IconX size={13} stroke={2.5} />}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
