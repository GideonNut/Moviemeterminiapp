import Link from 'next/link';
import { HomeIcon, TvIcon, GiftIcon } from '../icons';

import { Film } from 'lucide-react';


export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#0A0A0A] border-t border-white/10">
      <div className="grid grid-cols-3 py-5 pt-3">
        <Link href="/" className="flex flex-col items-center justify-center py-1 text-white hover:text-red-400 transition-colors group">
          <HomeIcon 
            size={20} 
            className="text-white group-hover:text-red-400 transition-colors" 
          />
          <span className="text-xs mt-0.5 font-medium">Home</span>
        </Link>
        
        <Link href="/movies" className="flex flex-col items-center justify-center py-1 text-white hover:text-red-400 transition-colors group">
          <Film 
            size={20} 
            className="text-white group-hover:text-red-400 transition-colors" 
          />
          <span className="text-xs mt-0.5 font-medium">Rate Movies</span>
        </Link>
        
        <Link href="/rewards" className="flex flex-col items-center justify-center py-1 text-white hover:text-red-400 transition-colors group">
          <GiftIcon 
            size={20} 
            className="text-white group-hover:text-red-400 transition-colors" 
          />
          <span className="text-xs mt-0.5 font-medium">Rewards</span>
        </Link>
      </div>
    </nav>
  );
}