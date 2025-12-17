// Default placeholder image for when no poster is available
const DEFAULT_POSTER_URL = 'https://placehold.co/400x600/1a1a1a/818181?text=No+Poster';

/**
 * Utility function to ensure poster URLs are full URLs
 */
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

/**
 * Function to check if a URL is a TMDB relative path
 */
export function isTmdbRelativePath(url: string | undefined | null): boolean {
  if (!url) return false;
  return url.startsWith('/') && !url.startsWith('http');
}

/**
 * Function to convert TMDB relative path to full URL
 */
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

/**
 * Function to filter movies that have valid poster URLs
 */
export function filterMoviesWithPosters<T extends { posterUrl?: string | null }>(movies: T[]): T[] {
  return movies.filter(movie => {
    if (!movie.posterUrl) return false;
    
    // Check if it's a valid URL or TMDB path
    const fullUrl = ensureFullPosterUrl(movie.posterUrl);
    return !!fullUrl && fullUrl !== '';
  });
}

/**
 * Function to check if a movie has a valid poster
 */
export function hasValidPoster(movie: { posterUrl?: string | null }): boolean {
  if (!movie.posterUrl) return false;
  const fullUrl = ensureFullPosterUrl(movie.posterUrl);
  return !!fullUrl && fullUrl !== '';
}

/**
 * Function to get movies with fallback poster handling
 */
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

