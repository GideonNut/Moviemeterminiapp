"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardTitle, CardDescription } from "~/components/ui/card";
import { Button } from "~/components/ui/Button";
import Image from "next/image";
import Link from "next/link";
import Header from "~/components/navigation/Header";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bell, BellOff, RefreshCw, Heart } from "lucide-react";
import { useAccount } from "wagmi";
import { ensureFullPosterUrl } from "~/lib/images/utils";
import { Skeleton } from "~/components/ui/Skeleton";

interface Movie {
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

export default function WatchlistPage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const [watchlist, setWatchlist] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);

  const fetchWatchlist = async () => {
    if (!isConnected || !address) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/watchlist?address=${address}`);
      if (response.ok) {
        const data = await response.json();
        setWatchlist(data);
      }
    } catch (error) {
      console.error('Error fetching watchlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeFromWatchlist = async (movieId: string) => {
    if (!address) return;

    try {
      setRemoving(movieId);
      const response = await fetch(`/api/watchlist?address=${address}&movieId=${movieId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setWatchlist(prev => prev.filter(movie => movie.id !== movieId));
      } else {
        throw new Error('Failed to remove from watchlist');
      }
    } catch (error) {
      console.error('Error removing from watchlist:', error);
      alert('Failed to remove movie from watchlist');
    } finally {
      setRemoving(null);
    }
  };

  useEffect(() => {
    if (isConnected && address) {
      fetchWatchlist();
    }
  }, [isConnected, address]);

  if (!isConnected) {
    return (
      <div className="max-w-2xl mx-auto px-4">
        <Header showSearch={true} />
        <div className="flex items-center mb-6 mt-5">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => router.back()} 
            className="mr-3 p-2"
          >
            <ArrowLeft size={18} />
          </Button>
          <h1 className="text-xl font-semibold text-foreground">My Watchlist</h1>
        </div>

        <Card className="bg-card border-border" data-slot="watchlist-empty-auth">
          <CardContent className="p-8 text-center">
            <Bell size={48} className="text-muted-foreground mx-auto mb-4" />
            <CardTitle className="text-base font-medium mb-2 text-foreground">
              Connect to View Watchlist
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Connect your wallet to see your saved movies
            </CardDescription>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4">
        <Header showSearch={true} />
        <div className="flex items-center mb-6 mt-5">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => router.back()} 
            className="mr-3 p-2"
          >
            <ArrowLeft size={18} />
          </Button>
          <h1 className="text-xl font-semibold text-foreground">My Watchlist</h1>
        </div>

        {/* Stats skeleton */}
        <div className="mb-6 p-4 rounded-lg border border-border bg-card">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>

        {/* Watchlist item skeletons */}
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-card text-foreground border border-border overflow-hidden rounded">
              <div className="p-0">
                <div className="flex">
                  {/* Poster skeleton */}
                  <div className="w-24 h-36 relative flex-shrink-0 overflow-hidden">
                    <Skeleton className="w-full h-full" />
                  </div>

                  {/* Content skeleton */}
                  <div className="flex-1 p-4 flex flex-col justify-between text-left">
                    <div>
                      <div className="mb-1">
                        <Skeleton className="h-5 w-2/3" />
                      </div>
                      <div className="mb-3">
                        <Skeleton className="h-3 w-40" />
                      </div>
                      <div className="mb-3 space-y-1">
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-3 w-3/4" />
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Skeleton className="h-8 flex-1" />
                      <Skeleton className="h-8 w-9" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4">
      <Header showSearch={true} />
      <div className="flex items-center mb-6 mt-15">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => router.back()} 
          className="mr-3 p-2"
        >
          <ArrowLeft size={18} />
        </Button>
        <h1 className="text-xl font-semibold text-foreground">My Watchlist</h1>
      </div>

      {/* Watchlist Count */}
      <div className="mb-6 p-4 rounded-lg border border-border bg-card" data-slot="watchlist-stats">
        <div className="flex items-center gap-2">
          <Heart size={20} className="text-accent-foreground" />
          <span className="text-foreground font-medium">
            {watchlist.length} movie{watchlist.length !== 1 ? 's' : ''} in your watchlist
          </span>
        </div>
      </div>

      {/* Watchlist */}
      {watchlist.length === 0 ? (
        <Card className="bg-card border-border" data-slot="watchlist-empty">
          <CardContent className="p-8 text-center">
            <Bell size={48} className="text-muted-foreground mx-auto mb-4" />
            <CardTitle className="text-base font-medium mb-2 text-foreground">
              Your watchlist is empty
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground mb-4">
              Add movies to your watchlist by clicking the bell icon on any movie card
            </CardDescription>
            <Link href="/movies">
              <Button variant="outline" size="sm">
                Browse Movies
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {watchlist.map((movie) => (
            <Card key={movie.id} className="bg-card text-foreground border border-border overflow-hidden" data-slot="watchlist-item">
              <CardContent className="p-0">
                <div className="flex">
                  {/* Movie Poster */}
                  <div className="w-24 h-36 relative bg-neutral-900 flex-shrink-0 overflow-hidden">
                    {movie.posterUrl ? (
                      <Image
                        src={ensureFullPosterUrl(movie.posterUrl) || ''}
                        alt={movie.title}
                        fill
                        className="object-cover w-full h-full"
                        sizes="96px"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-white/40">
                        <span className="text-xs">No Poster</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Movie Info */}
                  <div className="flex-1 p-4 flex flex-col justify-between text-left">
                    <div>
                      <CardTitle className="text-base font-semibold mb-1 line-clamp-2">
                        {movie.title}
                      </CardTitle>
                      <CardDescription className="text-sm text-muted-foreground mb-3">
                        <span className="truncate block">{movie.genres && movie.genres.length > 0 ? movie.genres[0] : 'Unknown'} {movie.releaseYear || 'Unknown Year'}</span>
                      </CardDescription>

                      {/* Movie Description */}
                      <div className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {movie.description || 'No description available'}
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex items-center gap-3">
                      <Link href={`/movies/${movie.id}`} className="flex-1">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full text-xs"
                        >
                          View Details
                        </Button>
                      </Link>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeFromWatchlist(movie.id)}
                        disabled={removing === movie.id}
                        className="p-2"
                        title="Remove from watchlist"
                      >
                        {removing === movie.id ? (
                          <RefreshCw size={16} className="animate-spin" />
                        ) : (
                          <BellOff size={16} />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}