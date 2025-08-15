"use client";
import Link from 'next/link';
import Image from 'next/image';
import SearchBar from './SearchBar';

interface HeaderProps {
  showSearch?: boolean;
  onSearch?: (query: string) => void;
}

export default function Header({ showSearch = false, onSearch }: HeaderProps) {
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
          
          {/* User Avatar on right */}
          <div className="w-10 h-10 relative">
            <Image
              src="https://randomuser.me/api/portraits/men/32.jpg"
              alt="User Profile"
              layout="fill"
              objectFit="cover"
              className="rounded-full border-2 border-white/20"
            />
          </div>
        </div>
        
        {/* Conditional Search Bar */}
        {showSearch && <SearchBar onSearch={onSearch} />}
      </div>
    </header>
  );
}