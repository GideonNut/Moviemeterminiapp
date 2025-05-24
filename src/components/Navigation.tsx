import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0A0A0A] border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left side - Logo and Rewards */}
          <div className="flex items-center gap-8">
            <Link href="/" className="text-white text-xl font-bold flex items-center">
              <div className="w-48 h-12 relative">
                <Image
                  src="https://i.postimg.cc/Gtz6FMmk/new-favicon.png"
                  alt="MovieMetter Logo"
                  layout="fill"
                  objectFit="contain"
                />
              </div>
            </Link>
            <Link
              href="/rewards"
              className={`px-4 py-2 rounded-md text-base font-medium border-2 border-transparent transition-colors duration-200 ${
                pathname === '/rewards'
                  ? 'bg-white text-black'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              Rewards
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
} 