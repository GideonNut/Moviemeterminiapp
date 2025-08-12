const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w500";

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

export function mapTmdbToNewMovie(tmdb: TmdbMovie): NewMovie {
  const title = tmdb.title ?? tmdb.name ?? "Untitled";
  const releaseDate = tmdb.release_date ?? tmdb.first_air_date ?? "";
  const posterUrl = tmdb.poster_path ? `${TMDB_IMAGE_BASE}${tmdb.poster_path}` : undefined;
  return {
    id: `tmdb:${tmdb.id}`,
    title,
    description: tmdb.overview ?? "",
    posterUrl,
    releaseYear: releaseDate ? releaseDate.slice(0, 4) : undefined,
    genres: [],
  };
}

export type { NewMovie, TmdbMovie };


