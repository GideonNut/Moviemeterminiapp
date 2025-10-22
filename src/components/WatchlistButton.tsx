"use client";
import { useState, useEffect } from "react";
import { Button } from "~/components/ui/Button";
import { Bell, BellOff, RefreshCw } from "lucide-react";
import { useAccount } from "wagmi";
import { cn } from "~/lib/utils";

interface WatchlistButtonProps {
  movieId: string;
  movieTitle?: string;
  size?: "sm" | "default" | "lg";
  className?: string;
  showText?: boolean;
}

export default function WatchlistButton({ 
  movieId, 
  movieTitle,
  size = "sm", 
  className = "",
  showText = false 
}: WatchlistButtonProps) {
  const { address, isConnected } = useAccount();
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true); // Start with true to show loading initially

  const checkWatchlistStatus = async () => {
    if (!isConnected || !address) {
      setChecking(false);
      return;
    }

    try {
      console.log('Checking watchlist status for movie:', movieId, 'address:', address);
      const response = await fetch(`/api/watchlist?address=${address}&movieId=${movieId}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Watchlist status response:', data);
        setIsInWatchlist(data.inWatchlist);
      } else {
        console.error('Failed to check watchlist status:', response.status);
      }
    } catch (error) {
      console.error('Error checking watchlist status:', error);
    } finally {
      setChecking(false);
    }
  };

  const toggleWatchlist = async () => {
    if (!isConnected || !address) {
      alert('Please connect your wallet first');
      return;
    }

    try {
      setLoading(true);
      console.log(`${isInWatchlist ? 'Removing from' : 'Adding to'} watchlist:`, movieId);
      
      if (isInWatchlist) {
        // Remove from watchlist
        const response = await fetch(`/api/watchlist?address=${address}&movieId=${movieId}`, {
          method: 'DELETE',
        });
        
        if (response.ok) {
          setIsInWatchlist(false);
          console.log('Successfully removed from watchlist');
        } else {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to remove from watchlist');
        }
      } else {
        // Add to watchlist
        const response = await fetch('/api/watchlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address, movieId, movieTitle }),
        });
        
        if (response.ok) {
          setIsInWatchlist(true);
          console.log('Successfully added to watchlist');
        } else {
          const errorData = await response.json();
          if (response.status === 409) {
            // Already in watchlist
            setIsInWatchlist(true);
            console.log('Movie already in watchlist');
          } else {
            throw new Error(errorData.error || 'Failed to add to watchlist');
          }
        }
      }
    } catch (error) {
      console.error('Error toggling watchlist:', error);
      alert(`Failed to ${isInWatchlist ? 'remove from' : 'add to'} watchlist`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkWatchlistStatus();
  }, [isConnected, address, movieId]);

//   if (!isConnected) {
//     return null; // Don't show button if not connected
//   }

  if (checking) {
    return (
      <Button
        variant="default"
        size={size}
        disabled
        className={`p-2 ${className}`}
      >
        <RefreshCw size={16} className="animate-spin" />
        
      </Button>
    );
  }

  return (
    <Button
      data-slot="watchlist-button"
      variant="ghost"
      size={size}
      onClick={toggleWatchlist}
      disabled={loading}
      className={cn(
        "p-2 transition-colors",
        isInWatchlist ? "text-foreground/70 hover:text-foreground hover:bg-accent" : "text-foreground/70 hover:text-foreground hover:bg-accent",
        className
      )}
      title={isInWatchlist ? "Remove from watchlist" : "Add to watchlist"}
    >
      {loading ? (
        <RefreshCw size={16} className="animate-spin" />
      ) : isInWatchlist ? (
       <Bell size={16} className="fill-current" />
      ) : (
       <BellOff size={16} />
      )}
      {showText && (
        <span className="ml-2 text-xs">
          {loading 
            ? 'Loading...' 
            : isInWatchlist 
              ? 'In Watchlist' 
              : 'Add to Watchlist'
          }
        </span>
      )}
    </Button>
  );
}