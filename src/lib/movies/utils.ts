import type { MediaItem } from "~/types";

/**
 * Gets the contract ID for a movie by its TMDB ID
 * Priority: 1. Stored contractId in Firestore, 2. Derived from creation date sorting
 * @param tmdbId TMDB ID of the movie
 * @param allMovies Array of all movies sorted by createdAt
 * @returns The contract ID or -1 if not found
 */
export function getContractIdForMovie(tmdbId: string, allMovies: MediaItem[]): number {
  // First, check if the movie has a stored contractId
  const movie = allMovies.find(m => m.id === tmdbId);
  if (movie && movie.contractId !== undefined && movie.contractId !== null) {
    const storedId = typeof movie.contractId === 'string' 
      ? parseInt(movie.contractId, 10) 
      : movie.contractId;
    if (!isNaN(storedId) && storedId >= 0) {
      return storedId;
    }
  }

  // Fallback: Sort movies by createdAt timestamp (oldest first) and use index
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

