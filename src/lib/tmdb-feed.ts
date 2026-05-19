import type { MovieData, TVShowData } from "~/lib/firestore";
import {
  constructTmdbImageUrl,
  fetchTrendingMovies,
  fetchTrendingTVShows,
  searchMovies,
  searchTVShows,
  type TmdbMovie,
} from "~/lib/tmdb";

export type ApiFeedItem = {
  id: string;
  _id: string;
  tmdbId: string;
  title: string;
  description: string;
  posterUrl?: string;
  releaseYear?: string;
  genres?: string[];
  votes: { yes: number; no: number };
  commentCount: number;
  contractId?: string | number;
  isTVShow: boolean;
  createdAt: string;
  updatedAt: string;
  firstAirDate?: string;
  lastAirDate?: string;
  numberOfSeasons?: number;
  numberOfEpisodes?: number;
};

function mapTmdbToFeedItem(
  tmdb: TmdbMovie,
  index: number,
  isTVShow: boolean
): ApiFeedItem {
  const tmdbId = String(tmdb.id);
  const title = tmdb.title ?? tmdb.name ?? "Untitled";
  const releaseDate = tmdb.release_date ?? tmdb.first_air_date ?? "";
  const now = new Date().toISOString();

  return {
    id: tmdbId,
    _id: tmdbId,
    tmdbId,
    title,
    description: tmdb.overview ?? "",
    posterUrl: constructTmdbImageUrl(tmdb.poster_path ?? null, "w500"),
    releaseYear: isTVShow
      ? undefined
      : releaseDate
        ? releaseDate.slice(0, 4)
        : undefined,
    genres: [],
    votes: { yes: 0, no: 0 },
    commentCount: 0,
    contractId: index,
    isTVShow,
    createdAt: now,
    updatedAt: now,
    ...(isTVShow && releaseDate ? { firstAirDate: releaseDate } : {}),
  };
}

function mergeFirestoreMovie(
  item: ApiFeedItem,
  stored: MovieData & { id?: string; _id?: string }
): ApiFeedItem {
  const storedId = stored.id || stored._id;
  return {
    ...item,
    id: storedId || item.id,
    _id: storedId || item._id,
    title: stored.title || item.title,
    description: stored.description || item.description,
    posterUrl: stored.posterUrl || item.posterUrl,
    releaseYear: stored.releaseYear || item.releaseYear,
    genres: stored.genres?.length ? stored.genres : item.genres,
    votes: stored.votes ?? item.votes,
    commentCount: stored.commentCount ?? item.commentCount,
    contractId: stored.contractId ?? item.contractId,
    createdAt: stored.createdAt?.toDate
      ? stored.createdAt.toDate().toISOString()
      : item.createdAt,
    updatedAt: stored.updatedAt?.toDate
      ? stored.updatedAt.toDate().toISOString()
      : item.updatedAt,
  };
}

function mapFirestoreOnly(
  stored: MovieData & { id?: string; _id?: string },
  index: number,
  isTVShow: boolean
): ApiFeedItem {
  const id = stored.id || stored._id || stored.tmdbId || `local-${index}`;
  return {
    id,
    _id: id,
    tmdbId: stored.tmdbId || id,
    title: stored.title || "Untitled",
    description: stored.description || "",
    posterUrl: stored.posterUrl,
    releaseYear: stored.releaseYear,
    genres: stored.genres || [],
    votes: stored.votes || { yes: 0, no: 0 },
    commentCount: stored.commentCount || 0,
    contractId: stored.contractId ?? index,
    isTVShow,
    createdAt: stored.createdAt?.toDate
      ? stored.createdAt.toDate().toISOString()
      : new Date().toISOString(),
    updatedAt: stored.updatedAt?.toDate
      ? stored.updatedAt.toDate().toISOString()
      : new Date().toISOString(),
    ...(isTVShow && (stored as MovieData & { firstAirDate?: string }).firstAirDate
      ? {
          firstAirDate: (stored as MovieData & { firstAirDate?: string })
            .firstAirDate,
        }
      : {}),
  };
}

async function fetchTmdbResults(
  isTVShow: boolean,
  searchTerm: string | null,
  page: number
): Promise<TmdbMovie[]> {
  if (searchTerm) {
    return isTVShow
      ? searchTVShows(searchTerm, page)
      : searchMovies(searchTerm, page);
  }

  const [page1, page2] = await Promise.all([
    isTVShow ? fetchTrendingTVShows(1) : fetchTrendingMovies(1),
    isTVShow ? fetchTrendingTVShows(2) : fetchTrendingMovies(2),
  ]);

  return [...page1, ...page2];
}

export async function buildTmdbMovieFeed(options: {
  searchTerm?: string | null;
  firestoreMovies?: MovieData[];
}): Promise<ApiFeedItem[]> {
  const { searchTerm = null, firestoreMovies = [] } = options;
  const storedByTmdbId = new Map(
    firestoreMovies
      .filter((m) => m.tmdbId)
      .map((m) => [String(m.tmdbId), m])
  );

  try {
    const tmdbResults = await fetchTmdbResults(false, searchTerm, 1);
    const seen = new Set<string>();

    const feed = tmdbResults
      .filter((item) => {
        const key = String(item.id);
        if (seen.has(key)) return false;
        seen.add(key);
        return Boolean(item.poster_path);
      })
      .map((item, index) => {
        const mapped = mapTmdbToFeedItem(item, index, false);
        const stored = storedByTmdbId.get(mapped.tmdbId);
        return stored ? mergeFirestoreMovie(mapped, stored) : mapped;
      });

    if (feed.length > 0) {
      return feed;
    }
  } catch (error) {
    console.warn("TMDB movie feed unavailable, using Firestore only:", error);
  }

  return firestoreMovies
    .filter((m) => m.title)
    .map((m, index) => mapFirestoreOnly(m, index, false));
}

export async function buildTmdbTVFeed(options: {
  searchTerm?: string | null;
  firestoreShows?: TVShowData[];
}): Promise<ApiFeedItem[]> {
  const { searchTerm = null, firestoreShows = [] } = options;
  const storedByTmdbId = new Map(
    firestoreShows
      .filter((s) => s.tmdbId)
      .map((s) => [String(s.tmdbId), s])
  );

  try {
    const tmdbResults = await fetchTmdbResults(true, searchTerm, 1);
    const seen = new Set<string>();

    const feed = tmdbResults
      .filter((item) => {
        const key = String(item.id);
        if (seen.has(key)) return false;
        seen.add(key);
        return Boolean(item.poster_path);
      })
      .map((item, index) => {
        const mapped = mapTmdbToFeedItem(item, index, true);
        const stored = storedByTmdbId.get(mapped.tmdbId);
        return stored ? mergeFirestoreMovie(mapped, stored) : mapped;
      });

    if (feed.length > 0) {
      return feed;
    }
  } catch (error) {
    console.warn("TMDB TV feed unavailable, using Firestore only:", error);
  }

  return firestoreShows
    .filter((s) => s.title)
    .map((s, index) => mapFirestoreOnly(s, index, true));
}
