import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Media, MediaItem } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format CELO balance for display
 */
export function formatCELOBalance(balance: bigint | string): string {
  const balanceBigInt = typeof balance === 'string' ? BigInt(balance) : balance;
  const balanceInCELO = Number(balanceBigInt) / Math.pow(10, 18);
  return balanceInCELO.toFixed(4);
}

/**
 * Check if user has sufficient CELO for gas fees
 * Celo gas fees are typically around 0.001-0.01 CELO per transaction
 */
export function hasSufficientCELOForGas(balance: { value: bigint } | bigint | string | undefined): boolean {
  if (!balance) return false;
  
  const balanceBigInt = typeof balance === 'object' && 'value' in balance 
    ? balance.value 
    : typeof balance === 'string' 
      ? BigInt(balance) 
      : balance;
  
  // Minimum 0.01 CELO for gas fees (with some buffer)
  const minimumRequired = BigInt(10_000_000_000_000_000); // 0.01 CELO in wei
  return balanceBigInt >= minimumRequired;
}

// Default placeholder image for when no poster is available
const DEFAULT_POSTER_URL = 'https://placehold.co/400x600/1a1a1a/818181?text=No+Poster';

// Utility function to ensure poster URLs are full URLs
export function ensureFullPosterUrl(posterUrl: string | undefined | null): string {
  if (!posterUrl) return DEFAULT_POSTER_URL;
  
  // If it's already a full URL, return as-is
  if (posterUrl.startsWith('http://') || posterUrl.startsWith('https://')) {
    return posterUrl;
  }
  
  // If it's a relative TMDB path (starts with /), convert to full URL
  if (posterUrl.startsWith('/')) {
    return `https://image.tmdb.org/t/p/w500${posterUrl}`;
  }
  
  // If it's a relative path without leading slash, add it
  if (!posterUrl.startsWith('/')) {
    return `https://image.tmdb.org/t/p/w500/${posterUrl}`;
  }
  
  return posterUrl;
}

// Function to check if a URL is a TMDB relative path
export function isTmdbRelativePath(url: string | undefined | null): boolean {
  if (!url) return false;
  return url.startsWith('/') && !url.startsWith('http');
}

// Function to convert TMDB relative path to full URL
export function convertTmdbPathToUrl(path: string, size: string = 'w500'): string {
  if (!path) return '';
  
  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  
  // For SVG files, use original size
  if (cleanPath.endsWith('.svg')) {
    return `https://image.tmdb.org/t/p/original/${cleanPath}`;
  }
  
  // For other files, use specified size
  return `https://image.tmdb.org/t/p/${size}/${cleanPath}`;
}

// Farcaster metadata function
export async function getFarcasterMetadata() {
  // This should return the Farcaster mini app metadata
  // For now, return a basic structure
  return {
    name: process.env.NEXT_PUBLIC_FRAME_NAME || "MovieMeter",
    description: process.env.NEXT_PUBLIC_FRAME_DESCRIPTION || "Vote on movies with your Farcaster friends",
    iconUrl: "/icon.png",
    homeUrl: process.env.NEXT_PUBLIC_URL || "https://moviemetrer.vercel.app",
    frame: {
      version: "1",
      name: process.env.NEXT_PUBLIC_FRAME_NAME || "MovieMeter",
      iconUrl: "/icon.png",
      homeUrl: process.env.NEXT_PUBLIC_URL || "https://moviemetrer.vercel.app",
      imageUrl: "/api/opengraph-image",
      buttonTitle: process.env.NEXT_PUBLIC_FRAME_BUTTON_TEXT || "Launch MovieMeter",
      splashImageUrl: "/splash.png",
      splashBackgroundColor: "#0A0A0A",
      description: process.env.NEXT_PUBLIC_FRAME_DESCRIPTION || "Vote on movies with your Farcaster friends",
      primaryCategory: process.env.NEXT_PUBLIC_FRAME_PRIMARY_CATEGORY || "entertainment",
    }
  };
}


/**
 * Gets the contract ID for a movie by its TMDB ID by sorting all movies by creation date
 * @param tmdbId TMDB ID of the movie
 * @param allMovies Array of all movies sorted by createdAt
 * @returns The contract ID (index in the sorted array) or -1 if not found
 */
export function getContractIdForMovie(tmdbId: string, allMovies: MediaItem[]): number {
  // Sort movies by createdAt timestamp (oldest first)
  const sortedMovies = [...allMovies].sort((a, b) => {
    const aTime = a.createdAt ? (a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt)).getTime() : 0;
    const bTime = b.createdAt ? (b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt)).getTime() : 0;
    return aTime - bTime;
  });

  // Find the index of the movie with the given ID
  const index = sortedMovies.findIndex(movie => movie.id === tmdbId);
  
  return index >= 0 ? index : -1;
}

/**
 * Gets all movies with their derived contract IDs
 * @param allMovies Array of all movies
 * @returns Array of movies with derived contractId property
 */
export function getMoviesWithDerivedContractIds(allMovies: MediaItem[]): MediaItem[] {
  // Sort movies by createdAt timestamp (oldest first)
  const sortedMovies = [...allMovies].sort((a, b) => {
    const aTime = a.createdAt ? (a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt)).getTime() : 0;
    const bTime = b.createdAt ? (b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt)).getTime() : 0;
    return aTime - bTime;
  });

  // Add contractId to each movie based on its position in the sorted array
  return sortedMovies.map((movie, index) => ({
    ...movie,
    contractId: index
  }));
}

// Function to filter movies that have valid poster URLs
export function filterMoviesWithPosters<T extends { posterUrl?: string | null }>(movies: T[]): T[] {
  return movies.filter(movie => {
    if (!movie.posterUrl) return false;
    
    // Check if it's a valid URL or TMDB path
    const fullUrl = ensureFullPosterUrl(movie.posterUrl);
    return !!fullUrl && fullUrl !== '';
  });
}

// Function to check if a movie has a valid poster
export function hasValidPoster(movie: { posterUrl?: string | null }): boolean {
  if (!movie.posterUrl) return false;
  const fullUrl = ensureFullPosterUrl(movie.posterUrl);
  return !!fullUrl && fullUrl !== '';
}

// Function to get movies with fallback poster handling
export function getMoviesWithPosterFallback<T extends { posterUrl?: string | null; title: string }>(movies: T[]): T[] {
  return movies.filter(movie => {
    // Keep movies that have any poster URL (even if it might fail to load)
    // This allows for graceful fallback in the UI
    return !!movie.posterUrl && movie.posterUrl.trim() !== '';
  }).map(movie => ({
    ...movie,
    posterUrl: ensureFullPosterUrl(movie.posterUrl)
  }));
}
