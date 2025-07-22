import { FrameNotificationDetails } from "@farcaster/frame-sdk";
import { Redis } from "@upstash/redis";
import { APP_NAME } from "./constants";

interface Movie {
  id: string;
  title: string;
  description: string;
  posterUrl?: string;
  releaseYear?: string;
  genres?: string[];
  votes: {
    yes: number;
    no: number;
  };
}

// In-memory fallback storage
const localStore = new Map<string, FrameNotificationDetails>();
const localMovieStore = new Map<string, Movie>();

// Use Redis if KV env vars are present, otherwise use in-memory
const useRedis = process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN;
const redis = useRedis ? new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
}) : null;

function getUserNotificationDetailsKey(fid: number): string {
  return `${APP_NAME}:user:${fid}`;
}

export async function getUserNotificationDetails(
  fid: number
): Promise<FrameNotificationDetails | null> {
  const key = getUserNotificationDetailsKey(fid);
  if (redis) {
    return await redis.get<FrameNotificationDetails>(key);
  }
  return localStore.get(key) || null;
}

export async function setUserNotificationDetails(
  fid: number,
  notificationDetails: FrameNotificationDetails
): Promise<void> {
  const key = getUserNotificationDetailsKey(fid);
  if (redis) {
    await redis.set(key, notificationDetails);
  } else {
    localStore.set(key, notificationDetails);
  }
}

export async function deleteUserNotificationDetails(
  fid: number
): Promise<void> {
  const key = getUserNotificationDetailsKey(fid);
  if (redis) {
    await redis.del(key);
  } else {
    localStore.delete(key);
  }
}

function getMovieKey(id: string): string {
  return `${APP_NAME}:movie:${id}`;
}

export async function saveMovie(movie: Omit<Movie, 'votes'>): Promise<void> {
  const movieData: Movie = {
    ...movie,
    votes: { yes: 0, no: 0 }
  };
  const key = getMovieKey(movie.id);
  
  if (redis) {
    await redis.set(key, JSON.stringify(movieData));
  } else {
    localMovieStore.set(key, movieData);
  }
}

export async function getAllMovies(): Promise<Movie[]> {
  if (redis) {
    const keys = await redis.keys(`${APP_NAME}:movie:*`);
    const movies = await Promise.all(
      keys.map(async (key) => {
        const data = await redis.get(key);
        return data ? JSON.parse(data as string) : null;
      })
    );
    return movies.filter(Boolean);
  }
  return Array.from(localMovieStore.values());
}

export async function saveVote(movieId: string, type: 'yes' | 'no'): Promise<void> {
  const key = getMovieKey(movieId);
  
  if (redis) {
    const movieData = await redis.get(key);
    if (!movieData) throw new Error('Movie not found');
    
    const movie: Movie = JSON.parse(movieData as string);
    movie.votes[type] += 1;
    await redis.set(key, JSON.stringify(movie));
  } else {
    const movie = localMovieStore.get(key);
    if (!movie) throw new Error('Movie not found');
    
    movie.votes[type] += 1;
    localMovieStore.set(key, movie);
  }
}
