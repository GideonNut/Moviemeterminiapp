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
  commentCount?: number;
  createdAt: Date;
  updatedAt: Date;
  isTVShow?: boolean;
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
  commentCount: { type: Number, default: 0 },
  isTVShow: { type: Boolean, default: false }
}, {
  timestamps: true
});

// Create and export the Movie model
export const Movie: Model<IMovie> = mongoose.models.Movie || mongoose.model<IMovie>("Movie", movieSchema);

// Vote Schema
interface IVote extends Document {
  movieId: string;
  type: "yes" | "no";
  userAddress: string;
  fid?: number;
  createdAt: Date;
  updatedAt: Date;
}

const voteSchema = new mongoose.Schema<IVote>({
  movieId: { type: String, required: true },
  type: { type: String, enum: ["yes", "no"], required: true },
  userAddress: { type: String, required: true },
  fid: { type: Number },
  createdAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

voteSchema.index({ movieId: 1, userAddress: 1 }, { unique: true });

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

// Watchlist Schema
interface IWatchlist extends Document {
  address: string;
  movieId: mongoose.Types.ObjectId;
  addedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const watchlistSchema = new mongoose.Schema<IWatchlist>({
  address: { type: String, required: true, index: true },
  movieId: { type: mongoose.Schema.Types.ObjectId, ref: "Movie", required: true },
  addedAt: { type: Date, default: Date.now },
}, { timestamps: true });

// Compound index to ensure unique user-movie combinations
watchlistSchema.index({ address: 1, movieId: 1 }, { unique: true });

// Comment Schema
interface IComment extends Document {
  movieId: mongoose.Types.ObjectId;
  address: string;
  content: string;
  timestamp: Date;
  isTVShow?: boolean;
  likes: string[];
  replies: Array<{
    address: string;
    content: string;
    timestamp: Date;
    likes: string[];
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const commentSchema = new mongoose.Schema<IComment>({
  movieId: { type: mongoose.Schema.Types.ObjectId, ref: "Movie", required: true },
  address: { type: String, required: true, index: true },
  content: { type: String, required: true, maxlength: 1000 },
  timestamp: { type: Date, default: Date.now },
  isTVShow: { type: Boolean, default: false },
  likes: [{ type: String }], // Array of addresses who liked the comment
  replies: [{
    address: { type: String, required: true },
    content: { type: String, required: true, maxlength: 500 },
    timestamp: { type: Date, default: Date.now },
    likes: [{ type: String }]
  }]
}, { timestamps: true });

// Index for efficient querying
commentSchema.index({ movieId: 1, timestamp: -1 });

// Create and export the Comment model
export const Comment: Model<IComment> = mongoose.models.Comment || mongoose.model<IComment>("Comment", commentSchema);

// Points Schema
interface IPoints extends Document {
  address: string;
  totalPoints: number;
  votePoints: number;
  commentPoints: number;
  lastUpdated: Date;
  createdAt: Date;
  updatedAt: Date;
}

const pointsSchema = new mongoose.Schema<IPoints>({
  address: { type: String, required: true, unique: true, index: true },
  totalPoints: { type: Number, default: 0 },
  votePoints: { type: Number, default: 0 },
  commentPoints: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now }
}, { timestamps: true });

// Initialize models immediately (not inside connectMongo)
let MovieModel: Model<IMovie>;
let VoteModel: Model<IVote>;
let NotificationModel: Model<INotification>;
let WatchlistModel: Model<IWatchlist>;
let CommentModel: Model<IComment>;
let PointsModel: Model<IPoints>;

// Initialize models if they don't exist
function initializeModels() {
  try {
    if (!MovieModel) {
      MovieModel = mongoose.models.Movie as Model<IMovie> || mongoose.model<IMovie>('Movie', movieSchema);
    }
    if (!VoteModel) {
      VoteModel = mongoose.models.Vote as Model<IVote> || mongoose.model<IVote>('Vote', voteSchema);
    }
    if (!NotificationModel) {
      NotificationModel = mongoose.models.Notification as Model<INotification> || mongoose.model<INotification>('Notification', notificationSchema);
    }
    if (!WatchlistModel) {
      WatchlistModel = mongoose.models.Watchlist as Model<IWatchlist> || mongoose.model<IWatchlist>('Watchlist', watchlistSchema);
    }
    if (!CommentModel) {
      CommentModel = mongoose.models.Comment as Model<IComment> || mongoose.model<IComment>('Comment', commentSchema);
    }
    if (!PointsModel) {
      PointsModel = mongoose.models.Points as Model<IPoints> || mongoose.model<IPoints>('Points', pointsSchema);
    }
  } catch (error) {
    console.error('Error initializing models:', error);
  }
}

// Connection management
let connection: Connection | null = null;
let isConnecting = false;

export async function connectMongo(): Promise<Connection> {
  try {
    // Initialize models first
    initializeModels();

    // If already connected, return existing connection
    if (connection && connection.readyState === 1) {
      return connection;
    }

    // If currently connecting, wait for it to complete
    if (isConnecting) {
      while (isConnecting) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      if (connection && connection.readyState === 1) {
        return connection;
      }
    }

    isConnecting = true;

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
    };

    // Connect to MongoDB and wait for it to complete
    await mongoose.connect(connectionUri, options);
    
    connection = mongoose.connection;
    
    // Wait for connection to be ready
    if (connection.readyState !== 1) {
      await new Promise((resolve, reject) => {
        connection!.once('connected', resolve);
        connection!.once('error', reject);
        // Add timeout
        setTimeout(() => reject(new Error('Connection timeout')), 10000);
      });
    }

    console.log('MongoDB connected successfully with Mongoose');

    // Set up connection event handlers
    connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
      connection = null;
    });

    // Ensure models are initialized after connection
    initializeModels();

    isConnecting = false;
    return connection;
  } catch (error) {
    isConnecting = false;
    console.error("MongoDB connection error:", error);
    throw new Error(`Failed to connect to MongoDB: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Helper function to ensure models are available
async function ensureConnection() {
  await connectMongo();
  initializeModels();
  
  if (!MovieModel || !VoteModel || !NotificationModel || !WatchlistModel || !CommentModel) {
    throw new Error('Models not initialized properly');
  }
}

// Collection getters (for backward compatibility)
export async function getMoviesCollection() {
  await ensureConnection();
  return MovieModel;
}

export async function getVotesCollection() {
  await ensureConnection();
  return VoteModel;
}

async function getNotificationsCollection() {
  await ensureConnection();
  return NotificationModel;
}

// Movies API with Mongoose
export async function getNextMovieId(): Promise<number> {
  try {
    await ensureConnection();
    
    // Get the highest existing ID
    const lastMovie = await MovieModel.findOne({}, { id: 1 }).sort({ id: -1 });
    
    if (!lastMovie) {
      return 0;
    }
    
    const lastId = parseInt(lastMovie.id, 10);
    return lastId + 1;
  } catch (error) {
    console.error("Error getting next movie ID:", error);
    return 0;
  }
}

export async function saveMovie(movie: { id?: string; title: string; description: string; posterUrl?: string; releaseYear?: string; genres?: string[]; isTVShow?: boolean }): Promise<{ id: string }> {
  try {
    await ensureConnection();
    
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
          isTVShow: movie.isTVShow ?? false,
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
    await ensureConnection();
    return await MovieModel.find({ isTVShow: { $ne: true } }).sort({ createdAt: -1 });
  } catch (error) {
    console.error("Error getting all movies:", error);
    throw new Error(`Failed to get movies: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getTVShows(): Promise<IMovie[]> {
  try {
    await ensureConnection();
    const tvShows = await MovieModel.find({ isTVShow: true }).lean().sort({ createdAt: -1 });
    
    // Get comment counts for each TV show and update them
    const tvShowsWithComments = await Promise.all(tvShows.map(async (tvShow) => {
      const commentCount = await CommentModel.countDocuments({ movieId: tvShow._id });
      return {
        ...tvShow,
        commentCount
      } as IMovie;
    }));

    return tvShowsWithComments;
  } catch (error) {
    console.error("Error getting TV shows:", error);
    throw new Error(`Failed to get TV shows: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function saveVote(movieId: string, type: "yes" | "no", userAddress: string): Promise<void> {
  try {
    await ensureConnection();
    
    const existingVote = await VoteModel.findOne({ movieId, userAddress });
    
    if (existingVote) {
      throw new Error(`User ${userAddress} has already voted on movie ${movieId}. Vote changes are not allowed.`);
    }
    
    await VoteModel.create({
      movieId,
      type,
      userAddress,
      createdAt: new Date()
    });

    await MovieModel.updateOne(
      { id: movieId },
      { $inc: { [`votes.${type}`]: 1 } }
    );
  } catch (error) {
    console.error("Error saving vote:", error);
    throw new Error(`Failed to save vote: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getUserVotes(userAddress: string): Promise<{ [movieId: string]: "yes" | "no" }> {
  try {
    await ensureConnection();
    
    const votes = await VoteModel.find({ userAddress }).sort({ createdAt: -1 });
    
    const voteMap: { [movieId: string]: "yes" | "no" } = {};
    votes.forEach(vote => {
      voteMap[vote.movieId] = vote.type;
    });
    
    return voteMap;
  } catch (error) {
    console.error("Error getting user votes:", error);
    return {};
  }
}

// Notification storage with Mongoose
export async function getUserNotificationDetails(fid: number): Promise<FrameNotificationDetails | null> {
  try {
    await ensureConnection();
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
    await ensureConnection();
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
    await ensureConnection();
    await NotificationModel.deleteOne({ fid });
  } catch (error) {
    console.error("Error deleting user notification details:", error);
    throw new Error(`Failed to delete notification details: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function resetMovieIds(): Promise<void> {
  try {
    await ensureConnection();
    
    const movies = await MovieModel.find({}).sort({ createdAt: 1 });
    
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
    await ensureConnection();
    return await MovieModel.countDocuments({});
  } catch (error) {
    console.error("Error getting movie count:", error);
    return 0;
  }
}

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

// Add watchlist functions
export async function addToWatchlist(address: string, movieId: string): Promise<void> {
  try {
    await ensureConnection();
    
    // Find the movie by id field, not _id
    const movie = await MovieModel.findOne({ id: movieId });
    if (!movie) {
      throw new Error('Movie not found');
    }

    await WatchlistModel.create({
      address,
      movieId: movie._id,
      addedAt: new Date()
    });
  } catch (error: any) {
    if (error.code === 11000) {
      throw new Error('Movie already in watchlist');
    }
    console.error("Error adding to watchlist:", error);
    throw new Error(`Failed to add to watchlist: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function removeFromWatchlist(address: string, movieId: string): Promise<void> {
  try {
    await ensureConnection();
    
    // Find the movie by id field, not _id
    const movie = await MovieModel.findOne({ id: movieId });
    if (!movie) {
      throw new Error('Movie not found');
    }

    await WatchlistModel.deleteOne({ address, movieId: movie._id });
  } catch (error) {
    console.error("Error removing from watchlist:", error);
    throw new Error(`Failed to remove from watchlist: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getUserWatchlist(address: string): Promise<IMovie[]> {
  try {
    await ensureConnection();
    
    const watchlistItems = await WatchlistModel.find({ address })
      .populate('movieId')
      .sort({ addedAt: -1 });
    
    return watchlistItems.map(item => item.movieId as unknown as IMovie);
  } catch (error) {
    console.error("Error getting user watchlist:", error);
    return [];
  }
}

export async function isInWatchlist(address: string, movieId: string): Promise<boolean> {
  try {
    await ensureConnection();
    
    // Find the movie by id field, not _id
    const movie = await MovieModel.findOne({ id: movieId });
    if (!movie) {
      return false;
    }

    const watchlistItem = await WatchlistModel.findOne({ address, movieId: movie._id });
    return !!watchlistItem;
  } catch (error) {
    console.error("Error checking watchlist:", error);
    return false;
  }
}

// Comment functions
export async function addComment(movieId: string, address: string, content: string): Promise<IComment> {
  try {
    await ensureConnection();
    
    // Find the movie by id field, not _id
    const movie = await MovieModel.findOne({ id: movieId });
    if (!movie) {
      throw new Error('Movie not found');
    }

    const comment = await CommentModel.create({
      movieId: movie._id,
      address,
      content: content.trim(),
      timestamp: new Date()
    });

    return comment;
  } catch (error) {
    console.error("Error adding comment:", error);
    throw new Error(`Failed to add comment: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getMovieComments(movieId: string): Promise<IComment[]> {
  try {
    await ensureConnection();
    
    // Find the movie by id field, not _id
    const movie = await MovieModel.findOne({ id: movieId });
    if (!movie) {
      return [];
    }

    const comments = await CommentModel.find({ movieId: movie._id })
      .sort({ timestamp: -1 })
      .limit(50); // Limit to 50 most recent comments
    
    return comments;
  } catch (error) {
    console.error("Error getting movie comments:", error);
    return [];
  }
}

export async function likeComment(commentId: string, address: string): Promise<void> {
  try {
    await ensureConnection();
    
    const comment = await CommentModel.findById(commentId);
    if (!comment) {
      throw new Error('Comment not found');
    }

    const hasLiked = comment.likes.includes(address);
    
    if (hasLiked) {
      // Remove like
      await CommentModel.updateOne(
        { _id: commentId },
        { $pull: { likes: address } }
      );
    } else {
      // Add like
      await CommentModel.updateOne(
        { _id: commentId },
        { $addToSet: { likes: address } }
      );
    }
  } catch (error) {
    console.error("Error liking comment:", error);
    throw new Error(`Failed to like comment: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function addReply(commentId: string, address: string, content: string): Promise<void> {
  try {
    await ensureConnection();
    
    const reply = {
      address,
      content: content.trim(),
      timestamp: new Date(),
      likes: []
    };

    await CommentModel.updateOne(
      { _id: commentId },
      { $push: { replies: reply } }
    );
  } catch (error) {
    console.error("Error adding reply:", error);
    throw new Error(`Failed to add reply: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Points functions
export async function addVotePoints(address: string): Promise<void> {
  try {
    await ensureConnection();
    
    const points = await PointsModel.findOneAndUpdate(
      { address },
      { 
        $inc: { 
          totalPoints: 1, 
          votePoints: 1 
        },
        $set: { 
          lastUpdated: new Date() 
        }
      },
      { 
        upsert: true, 
        new: true 
      }
    );
  } catch (error) {
    console.error("Error adding vote points:", error);
    throw new Error(`Failed to add vote points: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function addCommentPoints(address: string): Promise<void> {
  try {
    await ensureConnection();
    
    const points = await PointsModel.findOneAndUpdate(
      { address },
      { 
        $inc: { 
          totalPoints: 2, 
          commentPoints: 2 
        },
        $set: { 
          lastUpdated: new Date() 
        }
      },
      { 
        upsert: true, 
        new: true 
      }
    );
  } catch (error) {
    console.error("Error adding comment points:", error);
    throw new Error(`Failed to add comment points: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getUserPoints(address: string): Promise<IPoints | null> {
  try {
    await ensureConnection();
    
    const points = await PointsModel.findOne({ address });
    return points;
  } catch (error) {
    console.error("Error getting user points:", error);
    throw new Error(`Failed to get user points: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getAllUserPoints(): Promise<IPoints[]> {
  try {
    await ensureConnection();
    
    const points = await PointsModel.find({}).sort({ totalPoints: -1 });
    return points;
  } catch (error) {
    console.error("Error getting all user points:", error);
    throw new Error(`Failed to get all user points: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
