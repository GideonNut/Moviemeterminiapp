"use client";

import { MovieCard } from "~/components/MovieCard";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/Button";
import {
  Menubar,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarItem,
  MenubarSeparator,
} from "~/components/ui/menubar";
import trailersData from "../data/trailers.json";

export default function DiscoverPage() {
  const [isVoting, setIsVoting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  // Add state for trailers
  type Trailer = { id: string; title: string; genre: string; year: string; youtubeId: string };
  const [trailers, setTrailers] = useState<Trailer[]>([]);
  // Add state for modal
  const [openTrailer, setOpenTrailer] = useState<null | { title: string; youtubeId: string }>(null);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const connected = false;
        setIsConnected(connected);
      } catch (error) {
        console.error('Error checking connection:', error);
        setIsConnected(false);
      }
    };
    checkConnection();
  }, []);

  useEffect(() => {
    const fetchMovies = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/movies");
        const data = await res.json();
        if (data.success && Array.isArray(data.movies)) {
          setMovies(data.movies);
        }
      } catch (error) {
        console.error('Error fetching movies:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchMovies();
  }, []);

  useEffect(() => {
    // Load trailers from JSON (static import)
    setTrailers(trailersData);
  }, []);

  const handleVote = async (movieId: string, vote: 'yes' | 'no') => {
    setIsVoting(true);
    try {
      const res = await fetch("/api/movies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "vote", id: movieId, type: vote })
      });
      const data = await res.json();
      if (data.success) {
        // Refresh movies after voting
        const res = await fetch("/api/movies");
        const updated = await res.json();
        if (updated.success && Array.isArray(updated.movies)) {
          setMovies(updated.movies);
        }
      }
    } catch (error) {
      console.error('Error voting:', error);
    } finally {
      setIsVoting(false);
    }
  };

  const filteredMovies = movies.filter((movie: any) =>
    movie.title.toLowerCase().includes(search.toLowerCase()) ||
    (movie.genres && movie.genres.some((g: string) => g.toLowerCase().includes(search.toLowerCase())))
  );

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0A0A0A] border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16 justify-between">
            {/* Left: Logo */}
            <Link href="/" className="flex items-center mr-6">
              <div className="w-10 h-10 relative">
                <Image
                  src="https://i.postimg.cc/Gtz6FMmk/new-favicon.png"
                  alt="MovieMetter Logo"
                  layout="fill"
                  objectFit="contain"
                />
              </div>
            </Link>
            {/* Center: Navigation Links */}
            <Menubar className="bg-transparent border-none shadow-none text-white">
              <MenubarMenu>
                <MenubarTrigger className="bg-transparent">Home</MenubarTrigger>
              </MenubarMenu>
              <MenubarMenu>
                <MenubarTrigger className="bg-transparent">Movies</MenubarTrigger>
                <MenubarContent>
                  <MenubarItem>Movie News</MenubarItem>
                  <MenubarItem>Top Movies</MenubarItem>
                  <MenubarItem>Best movies top 250</MenubarItem>
                  <MenubarItem>Movie updates</MenubarItem>
                  <MenubarItem>Vote Movies</MenubarItem>
                  <MenubarItem>News Updates</MenubarItem>
                </MenubarContent>
              </MenubarMenu>
              <MenubarMenu>
                <MenubarTrigger className="bg-transparent">TV Shows</MenubarTrigger>
                <MenubarContent>
                  <MenubarItem>TV News</MenubarItem>
                  <MenubarItem>TV Shows updates</MenubarItem>
                </MenubarContent>
              </MenubarMenu>
              <MenubarMenu>
                <MenubarTrigger className="bg-transparent">Rewards</MenubarTrigger>
                <MenubarContent>
                  <MenubarItem>Actors</MenubarItem>
                  <MenubarItem>Directors</MenubarItem>
                  <MenubarItem>Celebrity News</MenubarItem>
                  <MenubarItem>Most Popular Celebrities</MenubarItem>
                  <MenubarItem>Top 100 Celebrities</MenubarItem>
                  <MenubarItem>Highest Net Worth Celebrities</MenubarItem>
                  <MenubarItem>Celebrities born today</MenubarItem>
                  <MenubarItem>Updates</MenubarItem>
                </MenubarContent>
              </MenubarMenu>
              <MenubarMenu>
                <MenubarTrigger className="bg-transparent">On Demand</MenubarTrigger>
                <MenubarContent>
                  <MenubarItem>Netflix</MenubarItem>
                  <MenubarItem>Disney+</MenubarItem>
                  <MenubarItem>Amazon Prime</MenubarItem>
                  <MenubarItem>HBO Max</MenubarItem>
                  <MenubarItem>BBC iPlayer</MenubarItem>
                  <MenubarItem>Apple TV+</MenubarItem>
                  <MenubarItem>Hulu</MenubarItem>
                  <MenubarItem>Paramount Plus</MenubarItem>
                  <MenubarItem>Sky Go</MenubarItem>
                </MenubarContent>
              </MenubarMenu>
              <MenubarMenu>
                <MenubarTrigger className="bg-transparent">Awards/Events</MenubarTrigger>
                <MenubarContent>
                  <MenubarItem>Oscars</MenubarItem>
                  <MenubarItem>Emmys</MenubarItem>
                  <MenubarItem>Sundance Film Festival</MenubarItem>
                  <MenubarItem>Cannes Film Festival</MenubarItem>
                  <MenubarItem>SXSW Film Festival</MenubarItem>
                  <MenubarItem>Tribeca Film Festival</MenubarItem>
                </MenubarContent>
              </MenubarMenu>
              <MenubarMenu>
                <MenubarTrigger className="bg-transparent">About Us</MenubarTrigger>
              </MenubarMenu>
              <MenubarMenu>
                <MenubarTrigger className="bg-transparent">Contact Us</MenubarTrigger>
              </MenubarMenu>
            </Menubar>
            {/* Right: Language Switcher & Profile/Login */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1 bg-[#18181B] rounded px-2 py-1 text-white text-sm">
                <button className="font-bold">NL</button>
                <span className="mx-1">/</span>
                <button>GB</button>
              </div>
              <div className="flex items-center">
                <Image
                  src="https://randomuser.me/api/portraits/men/32.jpg"
                  alt="Profile Picture"
                  width={36}
                  height={36}
                  className="rounded-full border-2 border-white/20 object-cover"
                />
                <span className="ml-2 text-white text-sm font-medium hidden sm:inline">Login</span>
              </div>
            </div>
          </div>
          {/* Centered Search Bar Below Navigation */}
          <div className="flex justify-center mt-2 mb-2">
            <Input
              type="text"
              placeholder="Search movies or genres..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-96"
            />
          </div>
        </div>
      </nav>
      {/* Main Content: Moviemeter.io style sections */}
      <main className="pt-32 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Newest Trailers (from trailers.json) */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4">Newest Trailers</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {trailers.length === 0 ? (
              <div className="col-span-4 text-center text-white">No trailers found.</div>
            ) : (
              trailers.slice(0, 4).map((trailer: any) => (
                <Card key={trailer.id} className="bg-[#18181B] text-white cursor-pointer" onClick={() => setOpenTrailer({ title: trailer.title, youtubeId: trailer.youtubeId })}>
                  <CardContent className="flex flex-col items-center p-4">
                    <div className="w-full h-40 mb-3 flex items-center justify-center overflow-hidden rounded">
                      <Image
                        src={`https://img.youtube.com/vi/${trailer.youtubeId}/hqdefault.jpg`}
                        alt={trailer.title}
                        width={320}
                        height={180}
                        className="object-cover w-full h-full"
                      />
                    </div>
                    <CardTitle className="mb-1 text-center w-full line-clamp-1">{trailer.title}</CardTitle>
                    <CardDescription className="mb-2 text-center w-full">{trailer.genre} / {trailer.year}</CardDescription>
                    <Button className="w-full" variant="secondary" onClick={e => { e.stopPropagation(); setOpenTrailer({ title: trailer.title, youtubeId: trailer.youtubeId }); }}>
                      Watch Trailer
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
          {/* Trailer Modal */}
          {openTrailer && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
              <div className="bg-[#18181B] rounded-lg shadow-lg p-4 max-w-xl w-full relative">
                <button
                  className="absolute top-2 right-2 text-white text-2xl font-bold hover:text-red-400"
                  onClick={() => setOpenTrailer(null)}
                  aria-label="Close"
                >
                  ×
                </button>
                <h3 className="text-lg font-bold text-white mb-4 text-center">{openTrailer.title}</h3>
                <div className="aspect-video w-full">
                  <iframe
                    width="100%"
                    height="315"
                    src={`https://www.youtube.com/embed/${openTrailer.youtubeId}?autoplay=1`}
                    title={openTrailer.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            </div>
          )}
        </section>
        {/* Newest Reviews (placeholder for now) */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4">Newest Reviews</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3].map((i) => (
              <Card key={i} className="bg-[#18181B] text-white">
                <CardContent className="flex gap-4 items-start p-4">
                  <Image src={`https://randomuser.me/api/portraits/men/3${i}.jpg`} alt="User" width={48} height={48} className="rounded-full border border-white/10" />
                  <div>
                    <CardTitle>User {i}</CardTitle>
                    <CardDescription className="mb-2">"This is a review snippet for movie {i}."</CardDescription>
                    <span className="text-xs text-white/60">Today, 12:0{i}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
        {/* Recently Added Movies (show next 4 movies as example) */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4">Recently Added Movies</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {loading ? (
              <div className="col-span-4 text-center text-white">Loading movies...</div>
            ) : filteredMovies.length === 0 ? (
              <div className="col-span-4 text-center text-white">No movies found.</div>
            ) : (
              filteredMovies.slice(4, 8).map((movie: any) => (
                <MovieCard
                  key={movie.id || movie._id}
                  movie={movie}
                  onVote={() => {}}
                  isVoting={false}
                  isConnected={true}
                />
              ))
            )}
          </div>
        </section>
        {/* Trending Celebrities (placeholder for now) */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4">Trending Celebrities</h2>
          <div className="flex gap-6 overflow-x-auto pb-2">
            {[1,2,3,4,5,6].map((i) => (
              <Card key={i} className="bg-[#18181B] text-white min-w-[160px]">
                <CardContent className="flex flex-col items-center p-4">
                  <Image src={`https://randomuser.me/api/portraits/men/${30+i}.jpg`} alt="Celebrity" width={64} height={64} className="rounded-full border border-white/10 mb-2" />
                  <CardTitle>Celebrity {i}</CardTitle>
                  <CardDescription>Popularity: {100 + i * 10}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
        {/* Trending On Demand (placeholder for now) */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4">Trending On Demand</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[1,2,3,4].map((i) => (
              <Card key={i} className="bg-[#18181B] text-white">
                <CardContent className="flex flex-col items-center p-4">
                  <div className="w-full h-32 bg-neutral-800 rounded mb-2 flex items-center justify-center">
                    <span className="text-3xl">📺</span>
                  </div>
                  <CardTitle>On Demand {i}</CardTitle>
                  <CardDescription>Service: Netflix</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
        {/* Trending Movies & TV Shows (show next 4 movies as example) */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4">Trending Movies & TV Shows</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {loading ? (
              <div className="col-span-4 text-center text-white">Loading movies...</div>
            ) : filteredMovies.length === 0 ? (
              <div className="col-span-4 text-center text-white">No movies found.</div>
            ) : (
              filteredMovies.slice(8, 12).map((movie: any) => (
                <MovieCard
                  key={movie.id || movie._id}
                  movie={movie}
                  onVote={() => {}}
                  isVoting={false}
                  isConnected={true}
                />
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
