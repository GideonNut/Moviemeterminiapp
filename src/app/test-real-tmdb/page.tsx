'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface TmdbMovie {
  id: number;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  release_date: string;
}

export default function TestRealTmdbPage() {
  const [movies, setMovies] = useState<TmdbMovie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMovies() {
      try {
        setLoading(true);
        setError(null);
        
        // Use a public TMDB endpoint that doesn't require authentication
        const response = await fetch('/api/test-tmdb');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('TMDB API Response:', data);
        
        if (data.movies && Array.isArray(data.movies)) {
          setMovies(data.movies);
        } else {
          console.warn('Unexpected API response format:', data);
          setMovies([]);
        }
      } catch (err) {
        console.error('Error fetching movies:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchMovies();
  }, []);

  const constructImageUrl = (path: string | null, size: string = 'w500') => {
    if (!path) return null;
    
    // Remove leading slash if present
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    return `https://image.tmdb.org/t/p/${size}/${cleanPath}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-white text-xl">Loading TMDB movies...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-red-400 text-xl">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] py-12">
      <div className="max-w-6xl mx-auto px-6">
        <h1 className="text-3xl font-bold text-white mb-8">🎬 Real TMDB Data Test</h1>
        
        <div className="mb-6 text-white/70">
          <p>Showing {movies.length} movies from TMDB API</p>
          <p className="text-sm">Check browser console and Network tab for debugging info</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {movies.map((movie) => {
            const posterUrl = constructImageUrl(movie.poster_path, 'w500');
            const backdropUrl = constructImageUrl(movie.backdrop_path, 'w1280');
            
            return (
              <div key={movie.id} className="bg-[#18181B] rounded-lg p-6 border border-white/10">
                <h3 className="text-xl font-semibold text-white mb-4">{movie.title}</h3>
                
                <div className="space-y-4">
                  {/* Poster Image */}
                  <div>
                    <h4 className="text-sm text-white/70 mb-2">Poster Image</h4>
                    <div className="relative aspect-[2/3] w-full overflow-hidden rounded-lg bg-gray-800">
                      {posterUrl ? (
                        <Image
                          src={posterUrl}
                          alt={`${movie.title} poster`}
                          fill
                          className="object-cover"
                          onError={(e) => {
                            console.error('Poster image failed to load:', posterUrl);
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                          onLoad={() => {
                            console.log('Poster image loaded successfully:', posterUrl);
                          }}
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <span className="text-gray-400">No poster available</span>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-white/50 mt-1">
                      Path: {movie.poster_path || 'null'}
                    </p>
                    <p className="text-xs text-white/50 break-all">
                      URL: {posterUrl || 'undefined'}
                    </p>
                  </div>

                  {/* Movie Info */}
                  <div className="text-sm text-white/70">
                    <p><strong>Release Date:</strong> {movie.release_date}</p>
                    <p className="mt-2 line-clamp-3">{movie.overview}</p>
                  </div>

                  {/* Backdrop Image */}
                  {backdropUrl && (
                    <div>
                      <h4 className="text-sm text-white/70 mb-2">Backdrop Image</h4>
                      <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-gray-800">
                        <Image
                          src={backdropUrl}
                          alt={`${movie.title} backdrop`}
                          fill
                          className="object-cover"
                          onError={(e) => {
                            console.error('Backdrop image failed to load:', backdropUrl);
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                          onLoad={() => {
                            console.log('Backdrop image loaded successfully:', backdropUrl);
                          }}
                        />
                      </div>
                      <p className="text-xs text-white/50 mt-1">
                        Path: {movie.backdrop_path}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {movies.length === 0 && (
          <div className="text-center text-white/70 py-12">
            <p>No movies found. Check the console for API response details.</p>
          </div>
        )}
      </div>
    </div>
  );
}
