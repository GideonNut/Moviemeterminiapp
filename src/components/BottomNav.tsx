import Link from 'next/link';
import { Home, Film, Tv, Gift, Trophy } from "lucide-react";


export default function BottomNav() {
 

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#0A0A0A] border-t border-white/10">
      <div className="grid grid-cols-4 py-5 pt-3">
        <Link href="/" className="flex flex-col items-center justify-center py-1 text-white hover:text-red-400 transition-colors">
          <Home size={20} />
          <span className="text-xs mt-0.5 font-medium">Home</span>
        </Link>
        <Link href="/movies" className="flex flex-col items-center justify-center py-1 text-white hover:text-red-400 transition-colors">
          <Film size={20} />
          <span className="text-xs mt-0.5 font-medium">Movies</span>
        </Link>
        <Link href="/tv" className="flex flex-col items-center justify-center py-1 text-white hover:text-red-400 transition-colors">
          <Tv size={20} />
          <span className="text-xs mt-0.5 font-medium">TV Shows</span>
        </Link>
        <Link href="/rewards" className="flex flex-col items-center justify-center py-1 text-white hover:text-red-400 transition-colors">
          <Gift size={20} />
          <span className="text-xs mt-0.5 font-medium">Rewards</span>
        </Link>
        <Link 
          href="/leaderboards"
          className="flex flex-col items-center justify-center py-1 text-white hover:text-purple-400 transition-colors"
        >
          <Trophy size={20} />
          <span className="text-xs mt-0.5 font-medium">Leaderboards</span>
        </Link>
      </div>
    </nav>
  );
}