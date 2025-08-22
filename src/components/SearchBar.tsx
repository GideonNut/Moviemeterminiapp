"use client";
import { Input } from "~/components/ui/input";
import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardTitle } from "~/components/ui/card";
import Image from 'next/image';

interface Movie {
  id?: string;
  _id?: string;
  title: string;
  genres?: string[];
  posterUrl?: string;
  description?: string;
  votes?: {
    yes: number;
    no: number;
  };
}

interface SearchBarProps {
  onSearch?: (query: string) => void;
  placeholder?: string;
  movies?: Movie[];
}

export default function SearchBar({ 
  onSearch, 
  placeholder = "Search movies or genres...",
  movies = []
}: SearchBarProps) {
  const [search, setSearch] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);
    onSearch?.(value);
    
    if (value.trim() === "") {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    // Filter movies based on search query
    const filtered = movies.filter((movie) => {
      const titleMatch = movie.title.toLowerCase().includes(value.toLowerCase());
      const genreMatch = movie.genres?.some(genre => 
        genre.toLowerCase().includes(value.toLowerCase())
      );
      return titleMatch || genreMatch;
    });

    setSearchResults(filtered.slice(0, 5)); // Limit to 5 results
    setShowResults(filtered.length > 0);
  };

  const handleMovieClick = (movie: Movie) => {
    setSearch("");
    setShowResults(false);
    // You can add navigation logic here if needed
    console.log('Selected movie:', movie);
  };

  return (
    <div className="relative w-full max-w-md mx-auto" ref={searchRef}>
      <Input
        type="text"
        placeholder={placeholder}
        value={search}
        onChange={handleChange}
        onFocus={() => search.trim() !== "" && setShowResults(searchResults.length > 0)}
        className="w-full text-sm"
      />
      
      {/* Search Results Dropdown */}
      {showResults && searchResults.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-[#18181B] border border-white/20 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto search-results-dropdown">
          {searchResults.map((movie) => (
            <div
              key={movie.id || movie._id}
              className="p-3 hover:bg-white/5 cursor-pointer border-b border-white/10 last:border-b-0 transition-colors duration-150"
              onClick={() => handleMovieClick(movie)}
            >
              <div className="flex items-center space-x-3">
                <div className="w-12 h-16 relative flex-shrink-0">
                  {movie.posterUrl ? (
                    <Image
                      src={movie.posterUrl}
                      alt={movie.title}
                      fill
                      className="object-cover rounded"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-600 rounded flex items-center justify-center">
                      <span className="text-white/50 text-xs">No Image</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-white text-sm font-medium truncate">
                    {movie.title}
                  </CardTitle>
                  {movie.genres && movie.genres.length > 0 && (
                    <p className="text-white/60 text-xs mt-1">
                      {movie.genres.slice(0, 2).join(', ')}
                    </p>
                  )}
                  {movie.description && (
                    <p className="text-white/40 text-xs mt-1 line-clamp-2">
                      {movie.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* No Results Message */}
      {showResults && search.trim() !== "" && searchResults.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-[#18181B] border border-white/20 rounded-lg shadow-lg z-50 p-3 search-results-dropdown">
          <p className="text-white/60 text-sm text-center">No movies found for "{search}"</p>
        </div>
      )}
    </div>
  );
}