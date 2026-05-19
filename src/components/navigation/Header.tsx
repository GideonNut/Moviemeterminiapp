"use client";
import Link from 'next/link';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import SearchBar from '../SearchBar';
import { BookmarkIcon, TrophyIcon, GiftIcon } from '../icons';

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
  useSession();

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
          
          {/* Right section */}
          <div className="flex items-center gap-4">
            <Link 
              href="/leaderboards" 
              className="text-foreground/70 hover:text-foreground transition-colors focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] rounded-md outline-none group"
              title="Leaderboard"
            >
              <TrophyIcon size={24} className="text-foreground/70 group-hover:text-foreground transition-colors" />
            </Link>

            <Link 
              href="/watchlist" 
              className="text-foreground/70 hover:text-foreground transition-colors focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] rounded-md outline-none group"
              title="My Watchlist"
            >
              <BookmarkIcon size={24} className="text-foreground/70 group-hover:text-foreground transition-colors" />
            </Link>

            <Link 
              href="/rewards" 
              className="text-foreground/70 hover:text-foreground transition-colors focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] rounded-md outline-none group"
              title="Rewards"
            >
              <GiftIcon size={24} className="text-foreground/70 group-hover:text-foreground transition-colors" />
            </Link>
          </div>
        </div>
        
        {showSearch && <SearchBar onSearch={onSearch} movies={movies} />}
      </div>
    </header>
  );
}


