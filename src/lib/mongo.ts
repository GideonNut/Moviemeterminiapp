import { MongoClient, Db, Collection } from "mongodb";

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error("MONGODB_URI environment variable is not set");
}
const dbName = "moviemetrer";
let client: MongoClient;
let db: Db;

export async function connectMongo() {
  if (!client) {
    client = new MongoClient(uri as string);
    await client.connect();
    db = client.db(dbName);
  }
  return db;
}

export async function getMoviesCollection(): Promise<Collection> {
  const database = await connectMongo();
  return database.collection("movies");
}

export async function getVotesCollection(): Promise<Collection> {
  const database = await connectMongo();
  return database.collection("votes");
}
