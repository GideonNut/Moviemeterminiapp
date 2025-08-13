import { MongoClient, Db, Collection } from "mongodb";
import { FrameNotificationDetails } from "@farcaster/frame-sdk";

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

const uri = process.env.MONGODB_URI;
const dbName = "moviemetrer";
let client: MongoClient;
let db: Db;

export async function connectMongo() {
  try {
    if (!client) {
      if (!uri) {
        throw new Error("MONGODB_URI environment variable is not set. Please create a .env.local file with your MongoDB connection string.");
      }
      client = new MongoClient(uri as string);
      await client.connect();
      db = client.db(dbName);
      console.log("MongoDB connected successfully to database:", dbName);
    }
    return db;
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw new Error(`Failed to connect to MongoDB: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getMoviesCollection(): Promise<Collection> {
  try {
    const database = await connectMongo();
    if (!database) {
      throw new Error("Failed to get database connection");
    }
    return database.collection("movies");
  } catch (error) {
    console.error("Error getting movies collection:", error);
    throw new Error(`Failed to get movies collection: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getVotesCollection(): Promise<Collection> {
  try {
    const database = await connectMongo();
    if (!database) {
      throw new Error("Failed to get database connection");
    }
    return database.collection("votes");
  } catch (error) {
    console.error("Error getting votes collection:", error);
    throw new Error(`Failed to get votes collection: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function getNotificationsCollection(): Promise<Collection> {
  const database = await connectMongo();
  return database.collection("user_notifications");
}

// Movies API parity with previous KV helpers
export async function saveMovie(movie: Omit<Movie, "votes">): Promise<void> {
  const movies = await getMoviesCollection();

  await movies.updateOne(
    { id: movie.id },
    {
      $set: {
        id: movie.id,
        title: movie.title,
        description: movie.description,
        posterUrl: movie.posterUrl,
        releaseYear: movie.releaseYear,
        genres: movie.genres ?? [],
      },
      $setOnInsert: { votes: { yes: 0, no: 0 } },
    },
    { upsert: true }
  );
}

export async function getAllMovies(): Promise<Movie[]> {
  const movies = await getMoviesCollection();
  const docs = await movies.find({}).toArray();
  return docs as unknown as Movie[];
}

export async function saveVote(
  movieId: string,
  type: "yes" | "no"
): Promise<void> {
  const movies = await getMoviesCollection();
  const result = await movies.updateOne(
    { id: movieId },
    { $inc: { ["votes." + type]: 1 } }
  );

  if (result.matchedCount === 0) {
    throw new Error("Movie not found");
  }
}

// Notification storage parity with previous KV helpers
export async function getUserNotificationDetails(
  fid: number
): Promise<FrameNotificationDetails | null> {
  const col = await getNotificationsCollection();
  const doc = await col.findOne({ fid });
  if (!doc) return null;
  // doc.details is expected to be FrameNotificationDetails
  return (doc as any).details ?? null;
}

export async function setUserNotificationDetails(
  fid: number,
  notificationDetails: FrameNotificationDetails
): Promise<void> {
  const col = await getNotificationsCollection();
  await col.updateOne(
    { fid },
    { $set: { fid, details: notificationDetails } },
    { upsert: true }
  );
}

export async function deleteUserNotificationDetails(fid: number): Promise<void> {
  const col = await getNotificationsCollection();
  await col.deleteOne({ fid });
}
