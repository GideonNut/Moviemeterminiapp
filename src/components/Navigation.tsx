import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0A0A0A] border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16">
          <div className="flex items-center mr-8">
            <Link href="/" className="text-white text-xl font-bold flex items-center">
              <div className="w-64 h-16 relative">
                <Image
                  src="https://i.postimg.cc/Gtz6FMmk/new-favicon.png"
                  alt="MovieMetter Logo"
                  layout="fill"
                  objectFit="contain"
                />
              </div>
            </Link>
          </div>
          <div className="flex items-center space-x-6">
            <Link
              href="/rewards"
              className={`px-4 py-3 rounded-md text-lg font-medium border-2 border-transparent ${
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