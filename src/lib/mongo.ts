import mongoose, { Connection, Model, Document } from "mongoose";
import { FrameNotificationDetails } from "@farcaster/frame-sdk";

// Movie Schema
interface IMovie extends Document {
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
  createdAt: Date;
  updatedAt: Date;
  isTVShow?: boolean; // Added isTVShow field
}

const movieSchema = new mongoose.Schema<IMovie>({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  posterUrl: { type: String },
  releaseYear: { type: String },
  genres: [{ type: String }],
  votes: {
    yes: { type: Number, default: 0 },
    no: { type: Number, default: 0 }
  },
  isTVShow: { type: Boolean, default: false } // Added isTVShow field
}, {
  timestamps: true
});

// Vote Schema
interface IVote extends Document {
  movieId: string;
  type: "yes" | "no";
  fid?: number;
  createdAt: Date;
}

const voteSchema = new mongoose.Schema<IVote>({
  movieId: { type: String, required: true },
  type: { type: String, enum: ["yes", "no"], required: true },
  fid: { type: Number },
  createdAt: { type: Date, default: Date.now }
});

// Notification Schema
interface INotification extends Document {
  fid: number;
  details: FrameNotificationDetails;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new mongoose.Schema<INotification>({
  fid: { type: Number, required: true, unique: true },
  details: { type: mongoose.Schema.Types.Mixed, required: true }
}, {
  timestamps: true
});

// Models
let MovieModel: Model<IMovie>;
let VoteModel: Model<IVote>;
let NotificationModel: Model<INotification>;

// Connection management
let connection: Connection | null = null;

export async function connectMongo(): Promise<Connection> {
  try {
    if (connection && connection.readyState === 1) {
      return connection;
    }

const uri = process.env.MONGODB_URI;
if (!uri) {
      throw new Error("MONGODB_URI environment variable is not set. Please create a .env.local file with your MongoDB connection string.");
    }

    console.log("MongoDB URI found, attempting connection...");
    
    // Validate and potentially fix the connection string
    let connectionUri = uri;
    if (!connectionUri.includes('?') && !connectionUri.includes('retryWrites')) {
      connectionUri += '?retryWrites=true&w=majority';
    }
    if (!connectionUri.includes('ssl=true')) {
      connectionUri += connectionUri.includes('?') ? '&ssl=true' : '?ssl=true';
    }

    console.log("Attempting MongoDB connection with Mongoose...");
    console.log("Connection URI (sanitized):", connectionUri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));

    // Mongoose connection options
    const options = {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      bufferCommands: false,
    };

    // Connect to MongoDB
    await mongoose.connect(connectionUri, options);
    
    connection = mongoose.connection;
    
    // Set up connection event handlers
    connection.on('connected', () => {
      console.log('MongoDB connected successfully with Mongoose');
    });

    connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });

    // Initialize models after connection
    if (!MovieModel) {
      MovieModel = mongoose.model<IMovie>('Movie', movieSchema);
    }
    if (!VoteModel) {
      VoteModel = mongoose.model<IVote>('Vote', voteSchema);
    }
    if (!NotificationModel) {
      NotificationModel = mongoose.model<INotification>('Notification', notificationSchema);
    }

    return connection;
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw new Error(`Failed to connect to MongoDB: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Collection getters (for backward compatibility)
export async function getMoviesCollection() {
  await connectMongo();
  return MovieModel;
}

export async function getVotesCollection() {
  await connectMongo();
  return VoteModel;
}

async function getNotificationsCollection() {
  await connectMongo();
  return NotificationModel;
}

// Movies API with Mongoose
export async function getNextMovieId(): Promise<number> {
  try {
    await connectMongo();
    
    // Get the highest existing ID
    const lastMovie = await MovieModel.findOne({}, { id: 1 }).sort({ id: -1 });
    
    if (!lastMovie) {
      // No movies exist, start from 0
      return 0;
    }
    
    // Parse the last ID and increment by 1
    const lastId = parseInt(lastMovie.id, 10);
    return lastId + 1;
  } catch (error) {
    console.error("Error getting next movie ID:", error);
    // Fallback to 0 if there's an error
    return 0;
  }
}

export async function saveMovie(movie: { id?: string; title: string; description: string; posterUrl?: string; releaseYear?: string; genres?: string[]; isTVShow?: boolean }): Promise<{ id: string }> {
  try {
    await connectMongo();
    
    // If no ID provided, generate the next sequential ID
    let movieId: string;
    if (!movie.id) {
      const nextId = await getNextMovieId();
      movieId = nextId.toString();
    } else {
      movieId = movie.id;
    }
    
    await MovieModel.findOneAndUpdate(
      { id: movieId },
      {
        $set: {
          id: movieId,
          title: movie.title,
          description: movie.description,
          posterUrl: movie.posterUrl,
          releaseYear: movie.releaseYear,
          genres: movie.genres ?? [],
          isTVShow: movie.isTVShow ?? false, // Add TV show flag
        },
        $setOnInsert: { votes: { yes: 0, no: 0 } },
      },
      { upsert: true, new: true }
    );
    
    return { id: movieId };
  } catch (error) {
    console.error("Error saving movie:", error);
    throw new Error(`Failed to save movie: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getAllMovies(): Promise<IMovie[]> {
  try {
    await connectMongo();
    return await MovieModel.find({ isTVShow: { $ne: true } }).sort({ createdAt: -1 });
  } catch (error) {
    console.error("Error getting all movies:", error);
    throw new Error(`Failed to get movies: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getTVShows(): Promise<IMovie[]> {
  try {
    await connectMongo();
    return await MovieModel.find({ isTVShow: true }).sort({ createdAt: -1 });
  } catch (error) {
    console.error("Error getting TV shows:", error);
    throw new Error(`Failed to get TV shows: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function saveVote(movieId: string, type: "yes" | "no"): Promise<void> {
  try {
    await connectMongo();
    
    // Save the vote record
    await VoteModel.create({
      movieId,
      type,
      createdAt: new Date()
    });

    // Update the movie's vote count
    const result = await MovieModel.updateOne(
      { id: movieId },
      { $inc: { [`votes.${type}`]: 1 } }
    );

    if (result.matchedCount === 0) {
      throw new Error("Movie not found");
    }
  } catch (error) {
    console.error("Error saving vote:", error);
    throw new Error(`Failed to save vote: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Notification storage with Mongoose
export async function getUserNotificationDetails(fid: number): Promise<FrameNotificationDetails | null> {
  try {
    await connectMongo();
    const doc = await NotificationModel.findOne({ fid });
    return doc?.details || null;
  } catch (error) {
    console.error("Error getting user notification details:", error);
    return null;
  }
}

export async function setUserNotificationDetails(
  fid: number,
  notificationDetails: FrameNotificationDetails
): Promise<void> {
  try {
    await connectMongo();
    await NotificationModel.findOneAndUpdate(
      { fid },
      { fid, details: notificationDetails },
      { upsert: true, new: true }
    );
  } catch (error) {
    console.error("Error setting user notification details:", error);
    throw new Error(`Failed to set notification details: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function deleteUserNotificationDetails(fid: number): Promise<void> {
  try {
    await connectMongo();
    await NotificationModel.deleteOne({ fid });
  } catch (error) {
    console.error("Error deleting user notification details:", error);
    throw new Error(`Failed to delete notification details: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function resetMovieIds(): Promise<void> {
  try {
    await connectMongo();
    
    // Get all movies sorted by creation date
    const movies = await MovieModel.find({}).sort({ createdAt: 1 });
    
    // Reset IDs to be sequential starting from 0
    for (let i = 0; i < movies.length; i++) {
      const newId = i.toString();
      await MovieModel.updateOne(
        { _id: movies[i]._id },
        { $set: { id: newId } }
      );
    }
    
    console.log(`Reset ${movies.length} movie IDs to be sequential starting from 0`);
  } catch (error) {
    console.error("Error resetting movie IDs:", error);
    throw new Error(`Failed to reset movie IDs: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getMovieCount(): Promise<number> {
  try {
    await connectMongo();
    return await MovieModel.countDocuments({});
  } catch (error) {
    console.error("Error getting movie count:", error);
    return 0;
  }
}

// Graceful shutdown
export async function disconnectMongo(): Promise<void> {
  try {
    if (connection) {
      await mongoose.disconnect();
      connection = null;
      console.log('MongoDB disconnected gracefully');
    }
  } catch (error) {
    console.error('Error disconnecting from MongoDB:', error);
  }
}
