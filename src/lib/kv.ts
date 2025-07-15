import { FrameNotificationDetails } from "@farcaster/frame-sdk";
import { Redis } from "@upstash/redis";
import { APP_NAME } from "./constants";
import { getMoviesCollection, getVotesCollection } from "./mongo";

// In-memory fallback storage
const localStore = new Map<string, FrameNotificationDetails>();
const localVoteStore = new Map<string, { yes: number; no: number }>();
const localMovieStore = new Map<string, any>();

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

function getMovieVoteKey(movieId: string): string {
  return `${APP_NAME}:movie:${movieId}:votes`;
}

export async function saveVote(movieId: string, vote: boolean): Promise<void> {
  const votes = await getVotesCollection();
  await votes.insertOne({ movieId, vote, timestamp: new Date() });
}

export async function saveMovie(movie: any): Promise<void> {
  const movies = await getMoviesCollection();
  await movies.insertOne(movie);
}
