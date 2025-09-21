"use client";
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import SearchBar from './SearchBar';
import { getFarcasterUser } from '~/lib/farcaster';
import { BellIcon, TrophyIcon } from './icons';

interface Movie {
  id?: string;
  _id?: string;
  title: string;
  genres?: string[];
  poster_path?: string;
  overview?: string;
}

interface HeaderProps {
  showSearch?: boolean;
  onSearch?: (query: string) => void;
  movies?: Movie[];
}

export default function Header({ showSearch = false, onSearch, movies = [] }: HeaderProps) {
  const { data: session } = useSession();
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (session?.user?.fid) {
        setIsLoading(true);
        try {
          const user = await getFarcasterUser(session.user.fid);
          if (user?.pfp) {
            setProfilePicture(user.pfp);
          } else {
            setProfilePicture(null);
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          setProfilePicture(null);
        } finally {
          setIsLoading(false);
        }
      } else {
        setProfilePicture(null);
      }
    };

    fetchUserProfile();
  }, [session?.user?.fid]);

  return (
    <header data-slot="header" className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          {/* Logo on left */}
          <Link href="/" className="flex items-center focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] rounded-md outline-none">
            <div className="w-10 h-10 relative">
              <Image
                src="https://i.postimg.cc/Gtz6FMmk/new-favicon.png"
                alt="MovieMeter Logo"
                layout="fill"
                objectFit="cover"
              />
            </div>
          </Link>
          
          {/* Right section with Leaderboard, Watchlist icon and Avatar */}
          <div className="flex items-center gap-4">
            {/* Leaderboard Icon */}
            <Link 
              href="/leaderboards" 
              className="text-foreground/70 hover:text-foreground transition-colors focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] rounded-md outline-none group"
              title="Leaderboard"
            >
              <TrophyIcon 
                size={24} 
                className="text-foreground/70 group-hover:text-foreground transition-colors" 
              />
            </Link>
            
            {/* Watchlist Icon */}
            <Link 
              href="/watchlist" 
              className="text-foreground/70 hover:text-foreground transition-colors focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] rounded-md outline-none group"
              title="My Watchlist"
            >
              <BellIcon 
                size={24} 
                className="text-foreground/70 group-hover:text-foreground transition-colors" 
              />
            </Link>
            
            {/* User Avatar - Only show if we have a valid profile picture */}
            {profilePicture && (
              <div className="w-10 h-10 relative">
                <Image
                  src={profilePicture}
                  alt="User Profile"
                  layout="fill"
                  objectFit="cover"
                  className="rounded-full border-2 border-border"
                />
                {isLoading && (
                  <div className="absolute inset-0 bg-black/20 rounded-full flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Conditional Search Bar */}
        {showSearch && <SearchBar onSearch={onSearch} movies={movies} />}
      </div>
    </header>
  );
}