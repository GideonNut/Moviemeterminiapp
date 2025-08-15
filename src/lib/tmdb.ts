const TMDB_BASE_URL = "https://api.themoviedb.org/3";

// TMDB Configuration types
type TmdbConfiguration = {
  images: {
    base_url: string;
    secure_base_url: string;
    poster_sizes: string[];
    backdrop_sizes: string[];
    logo_sizes: string[];
    profile_sizes: string[];
    still_sizes: string[];
  };
};

// Global configuration cache
let tmdbConfig: TmdbConfiguration | null = null;

type NewMovie = {
  id: string;
  title: string;
  description: string;
  posterUrl?: string;
  releaseYear?: string;
  genres?: string[];
};

type TmdbMovie = {
  id: number;
  title?: string;
  name?: string;
  overview?: string;
  poster_path?: string | null;
  release_date?: string;
  first_air_date?: string;
  genre_ids?: number[];
};

function getTmdbApiKey(): string {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    throw new Error("TMDB_API_KEY environment variable is not set");
  }
  return apiKey;
}

// Fetch TMDB configuration
async function getTmdbConfiguration(): Promise<TmdbConfiguration> {
  if (tmdbConfig) {
    return tmdbConfig;
  }

  const apiKey = getTmdbApiKey();
  const response = await fetch(`${TMDB_BASE_URL}/configuration`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      accept: "application/json",
    },
    cache: "force-cache", // Cache configuration as it rarely changes
  });

  if (!response.ok) {
    throw new Error(`TMDb configuration fetch failed: ${response.status} ${response.statusText}`);
  }

  const config = await response.json();
  tmdbConfig = config as TmdbConfiguration;
  return tmdbConfig;
}

// Helper function to construct image URLs
export function constructTmdbImageUrl(filePath: string | null, size: string = "w500"): string | undefined {
  if (!filePath) {
    return undefined;
  }
  
  // Remove leading slash if present
  const cleanPath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
  
  // For SVG files, use original size
  if (cleanPath.endsWith('.svg')) {
    return `https://image.tmdb.org/t/p/original/${cleanPath}`;
  }
  
  // For other files, use specified size
  return `https://image.tmdb.org/t/p/${size}/${cleanPath}`;
}

// Helper function for poster images
export function constructPosterUrl(filePath: string | null, size: string = "w500"): string | undefined {
  return constructTmdbImageUrl(filePath, size);
}

// Helper function for backdrop images
export function constructBackdropUrl(filePath: string | null, size: string = "w1280"): string | undefined {
  return constructTmdbImageUrl(filePath, size);
}

// Helper function for profile images
export function constructProfileUrl(filePath: string | null, size: string = "w185"): string | undefined {
  return constructTmdbImageUrl(filePath, size);
}

// Helper function for logo images
export function constructLogoUrl(filePath: string | null, size: string = "original"): string | undefined {
  return constructTmdbImageUrl(filePath, size);
}

export async function fetchTrendingMovies(page: number = 1): Promise<TmdbMovie[]> {
  const apiKey = getTmdbApiKey();
  const response = await fetch(
    `${TMDB_BASE_URL}/trending/movie/week?page=${page}`,
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        accept: "application/json",
      },
      // Avoid Next.js caching for dynamic imports
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(`TMDb trending fetch failed: ${response.status} ${response.statusText}`);
  }
  const data = await response.json();
  return (data.results ?? []) as TmdbMovie[];
}

export async function searchMovies(query: string, page: number = 1): Promise<TmdbMovie[]> {
  const apiKey = getTmdbApiKey();
  const url = new URL(`${TMDB_BASE_URL}/search/movie`);
  url.searchParams.set("query", query);
  url.searchParams.set("page", String(page));

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      accept: "application/json",
    },
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`TMDb search failed: ${response.status} ${response.statusText}`);
  }
  const data = await response.json();
  return (data.results ?? []) as TmdbMovie[];
}

export async function fetchTrendingTVShows(page: number = 1): Promise<TmdbMovie[]> {
  const apiKey = getTmdbApiKey();
  const response = await fetch(
    `${TMDB_BASE_URL}/trending/tv/week?page=${page}`,
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        accept: "application/json",
      },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(`TMDb TV trending fetch failed: ${response.status} ${response.statusText}`);
  }
  const data = await response.json();
  return (data.results ?? []) as TmdbMovie[];
}

export async function searchTVShows(query: string, page: number = 1): Promise<TmdbMovie[]> {
  const apiKey = getTmdbApiKey();
  const url = new URL(`${TMDB_BASE_URL}/search/tv`);
  url.searchParams.set("query", query);
  url.searchParams.set("page", String(page));

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      accept: "application/json",
    },
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`TMDb TV search failed: ${response.status} ${response.statusText}`);
  }
  const data = await response.json();
  return (data.results ?? []) as TmdbMovie[];
}

export function mapTmdbToNewMovie(tmdb: TmdbMovie): NewMovie {
  const title = tmdb.title ?? tmdb.name ?? "Untitled";
  const releaseDate = tmdb.release_date ?? tmdb.first_air_date ?? "";
  const posterUrl = constructTmdbImageUrl(tmdb.poster_path || null, "w500");
  
  return {
    id: `tmdb:${tmdb.id}`,
    title,
    description: tmdb.overview ?? "",
    posterUrl,
    releaseYear: releaseDate ? releaseDate.slice(0, 4) : undefined,
    genres: [],
  };
}

export type { NewMovie, TmdbMovie, TmdbConfiguration };


