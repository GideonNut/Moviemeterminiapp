"use client";
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Eye } from 'lucide-react';
import SearchBar from './SearchBar';
import { getFarcasterUser } from '~/lib/farcaster';

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
  const [profilePicture, setProfilePicture] = useState<string>('https://randomuser.me/api/portraits/men/32.jpg');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (session?.user?.fid) {
        setIsLoading(true);
        try {
          const user = await getFarcasterUser(session.user.fid);
          if (user?.pfp) {
            setProfilePicture(user.pfp);
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchUserProfile();
  }, [session?.user?.fid]);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#0A0A0A] border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          {/* Logo on left */}
          <Link href="/" className="flex items-center">
            <div className="w-10 h-10 relative">
              <Image
                src="https://i.postimg.cc/Gtz6FMmk/new-favicon.png"
                alt="MovieMeter Logo"
                layout="fill"
                objectFit="cover"
              />
            </div>
          </Link>
          
          {/* Right section with Watchlist icon and Avatar */}
          <div className="flex items-center space-x-4">
            {/* Watchlist Icon */}
            <Link 
              href="/watchlist" 
              className="text-white/70 hover:text-purple-400 transition-colors"
              title="My Watchlist"
            >
              <Eye size={24} />
            </Link>
            
            {/* User Avatar */}
            <div className="w-10 h-10 relative">
              <Image
                src={profilePicture}
                alt="User Profile"
                layout="fill"
                objectFit="cover"
                className="rounded-full border-2 border-white/20"
              />
              {isLoading && (
                <div className="absolute inset-0 bg-black/20 rounded-full flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Conditional Search Bar */}
        {showSearch && <SearchBar onSearch={onSearch} movies={movies} />}
      </div>
    </header>
  );
}