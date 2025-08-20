"use client";

import { MovieCard } from "~/components/MovieCard";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/Button";
import { Home, Film, Tv, Gift } from "lucide-react";
import trailersData from "../data/trailers.json";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "~/components/ui/carousel";
import  Header  from "~/components/Header";

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

  const handleSearch = (query: string) => {
    // Handle search logic here
    console.log('Searching for:', query);
  };

  const filteredMovies = movies.filter((movie: any) =>
    movie.title.toLowerCase().includes(search.toLowerCase()) ||
    (movie.genres && movie.genres.some((g: string) => g.toLowerCase().includes(search.toLowerCase())))
  );

  return (
    <div className="min-h-screen relative bg-[#0A0A0A] pb-10 overflow-x-hidden">

   
 
      {/* Top Header */}
      <Header showSearch={true} onSearch={handleSearch} />

      {/* Main Content */}
      <main className="pt-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Newest Trailers */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-3">Newest Trailers</h2>
          <div className="relative">
            <Carousel className="w-full">
              <CarouselContent className="-ml-2 md:-ml-4">
                {trailers.length === 0 ? (
                  <div className="text-center text-white w-full text-sm">No trailers found.</div>
                ) : (
                  trailers.map((trailer: any) => (
                    <CarouselItem key={trailer.id} className="pl-2 md:pl-4 basis-[280px] md:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                      <Card className="bg-[#18181B] text-white cursor-pointer" onClick={() => setOpenTrailer({ title: trailer.title, youtubeId: trailer.youtubeId })}>
                        <CardContent className="flex flex-col items-center p-3">
                          <div className="w-full h-36 mb-2 flex items-center justify-center overflow-hidden rounded">
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
                        <CardTitle className="mb-1 text-center w-full line-clamp-1 text-sm font-medium">{trailer.title}</CardTitle>
                        <CardDescription className="mb-2 text-center w-full text-xs text-white/70">{trailer.genre} / {trailer.year}</CardDescription>
                        <Button className="w-full text-xs py-1.5" variant="secondary" onClick={e => { e.stopPropagation(); setOpenTrailer({ title: trailer.title, youtubeId: trailer.youtubeId }); }}>
                          Watch Trailer
                        </Button>
                      </CardContent>
                    </Card>
                  </CarouselItem>
                ))
              )}
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex -left-4" />
            <CarouselNext className="hidden md:flex -right-4" />
          </Carousel>
        </div>
        {/* Trailer Modal */}
        {openTrailer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
            <div className="bg-[#18181B] rounded-lg shadow-lg p-4 max-w-xl w-full relative">
              <button
                className="absolute top-2 right-2 text-white text-xl font-bold hover:text-red-400"
                onClick={() => setOpenTrailer(null)}
                aria-label="Close"
              >
                ×
              </button>
              <h3 className="text-base font-semibold text-white mb-3 text-center pr-6">{openTrailer.title}</h3>
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

      {/* Recently Added Movies */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-white mb-3">Recently Added Movies</h2>
        <div className="relative">
          <Carousel className="w-full">
            <CarouselContent className="-ml-2 md:-ml-4">
              {loading ? (
                <div className="text-center text-white w-full text-sm py-8">Loading movies...</div>
              ) : filteredMovies.length === 0 ? (
                <div className="text-center text-white w-full text-sm py-8">No movies found.</div>
              ) : (
                filteredMovies.slice(4, 8).map((movie: any) => (
                  <CarouselItem key={movie.id || movie._id} className="pl-2 md:pl-4 basis-full">
                    <div className="flex justify-center">
                      <MovieCard
                        movie={movie}
                        onVote={() => {}}
                        isVoting={false}
                        isConnected={true}
                      />
                    </div>
                  </CarouselItem>
                ))
              )}
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex -left-4" />
            <CarouselNext className="hidden md:flex -right-4" />
          </Carousel>
        </div>
      </section>

      {/* Newest Reviews */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-white mb-3">Newest Reviews</h2>
        <div className="flex justify-center items-center min-h-[80px]">
          <span className="text-white/60 text-sm">There are no reviews at this time.</span>
        </div>
      </section>

      {/* Trending Celebrities */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-white mb-3">Trending Celebrities</h2>
        <div className="flex justify-center items-center min-h-[80px]">
          <span className="text-white/60 text-sm">There are no trending celebrities at this time.</span>
        </div>
      </section>

      {/* Trending On Demand */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-white mb-3">Trending On Demand</h2>
        <div className="flex justify-center items-center min-h-[80px]">
          <span className="text-white/60 text-sm">There are no trending on demand items at this time.</span>
        </div>
      </section>

      {/* Trending Movies & TV Shows */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-white mb-3">Trending Movies & TV Shows</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {loading ? (
            <div className="col-span-4 text-center text-white text-sm py-8">Loading movies...</div>
          ) : filteredMovies.length === 0 ? (
            <div className="col-span-4 text-center text-white text-sm py-8">No movies found.</div>
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

    {/* Bottom Navigation */}
  
  </div>
  );
}
