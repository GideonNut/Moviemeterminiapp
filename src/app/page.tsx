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
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "~/components/ui/carousel";

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
                <MenubarContent className="bg-[#18181B] text-white">
                  <MenubarItem>
                    <Link href="/vote-movies" className="w-full h-full block">Vote Movies</Link>
                  </MenubarItem>
                  <MenubarItem>Top Movies</MenubarItem>
                  <MenubarItem>Movie News</MenubarItem>
                </MenubarContent>
              </MenubarMenu>
              <MenubarMenu>
                <MenubarTrigger className="bg-transparent">TV Shows</MenubarTrigger>
                <MenubarContent className="bg-[#18181B] text-white">
                  <MenubarItem>TV News</MenubarItem>
                  <MenubarItem>TV Shows updates</MenubarItem>
                </MenubarContent>
              </MenubarMenu>
              <MenubarMenu>
                <MenubarTrigger asChild>
                  <Link href="/rewards" className="bg-transparent px-3 py-1 rounded-sm text-sm font-medium text-white hover:bg-accent hover:text-accent-foreground transition-colors">Rewards</Link>
                </MenubarTrigger>
              </MenubarMenu>
              <MenubarMenu>
                <MenubarTrigger className="bg-transparent">On Demand</MenubarTrigger>
              </MenubarMenu>
              <MenubarMenu>
                <MenubarTrigger className="bg-transparent">Awards/Events</MenubarTrigger>
                <MenubarContent className="bg-[#18181B] text-white">
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
          <Carousel className="w-full">
            <CarouselContent className="-ml-1">
              {trailers.length === 0 ? (
                <div className="text-center text-white">No trailers found.</div>
              ) : (
                trailers.map((trailer: any) => (
                  <CarouselItem key={trailer.id} className="pl-1 md:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                    <div className="p-1">
                      <Card className="bg-[#18181B] text-white cursor-pointer" onClick={() => setOpenTrailer({ title: trailer.title, youtubeId: trailer.youtubeId })}>
                        <CardContent className="flex flex-col items-center p-4">
                          <div className="w-full h-40 mb-3 flex items-center justify-center overflow-hidden rounded">
                            <Image
                              src={
                                trailer.title === "Dune: Part Two"
                                  ? "https://i.postimg.cc/tg8JzJ5J/dune-2.jpg"
                                  : trailer.title === "Deadpool & Wolverine"
                                  ? "https://i.postimg.cc/j2whFDV1/deadpool.jpg"
                                  : trailer.title === "Kingdom of the Planet of the Apes"
                                  ? "https://i.postimg.cc/4xQN9wK8/KINGDOM.jpg"
                                  : `https://img.youtube.com/vi/${trailer.youtubeId}/hqdefault.jpg`
                              }
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
                    </div>
                  </CarouselItem>
                ))
              )}
            </CarouselContent>
            <CarouselNext />
          </Carousel>
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
        {/* Newest Reviews (placeholder for now) */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4">Newest Reviews</h2>
          <div className="flex justify-center items-center min-h-[100px]">
            <span className="text-white/60 text-lg">There are no reviews at this time.</span>
            </div>
          </section>
        {/* Trending Celebrities (placeholder for now) */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4">Trending Celebrities</h2>
          <div className="flex justify-center items-center min-h-[100px]">
            <span className="text-white/60 text-lg">There are no trending celebrities at this time.</span>
          </div>
        </section>
        {/* Trending On Demand (placeholder for now) */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4">Trending On Demand</h2>
          <div className="flex justify-center items-center min-h-[100px]">
            <span className="text-white/60 text-lg">There are no trending on demand items at this time.</span>
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
