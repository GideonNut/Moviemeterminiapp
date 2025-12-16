import { FrameNotificationDetails } from '@farcaster/frame-sdk';
import { db } from './firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  addDoc,
  query, 
  where, 
  orderBy,
  limit,
  serverTimestamp,
  updateDoc,
  increment,
  deleteDoc,
  arrayUnion,
  arrayRemove,
  runTransaction,
  Timestamp
} from 'firebase/firestore';

const MOVIES_COLLECTION = 'movies';
const COMMENTS_COLLECTION = 'comments';
const NOTIFICATIONS_COLLECTION = 'notifications';

export interface MovieData {
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
  isTVShow?: boolean;
  tmdbId: string;
  contractId?: string; // Contract movie ID (sequential integer as string)
  createdAt: any;
  updatedAt: any;
}

export interface CommentReply {
  address: string;
  content: string;
  timestamp: string;
  likes: string[];
}

export interface CommentData {
  id: string;
  _id: string;
  movieId: string;
  address: string;
  content: string;
  isTVShow?: boolean;
  likes: string[];
  replies: CommentReply[];
  timestamp: string;
  createdAt?: any;
}

export interface PointsData {
  address: string;
  totalPoints: number;
  votePoints: number;
  commentPoints: number;
  lastUpdated?: string;
}

const serializeTimestamp = (value: any): string => {
  if (!value) {
    return new Date(0).toISOString();
  }
  if (typeof value === 'string') {
    return value;
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value?.toDate === 'function') {
    return value.toDate().toISOString();
  }
  try {
    return new Date(value).toISOString();
  } catch {
    return new Date(0).toISOString();
  }
};

export const saveMovie = async (movieData: Omit<MovieData, 'createdAt' | 'updatedAt' | 'votes'>) => {
  const movieRef = doc(db, MOVIES_COLLECTION, movieData.tmdbId);
  
  // Auto-assign contractId if not provided
  let contractId = movieData.contractId;
  if (!contractId) {
    // Get all movies to determine the next contract ID
    const allMovies = await getAllMovies();
    // Sort by creation date to get consistent ordering
    const sortedMovies = [...allMovies].sort((a, b) => {
      const aTime = a.createdAt?.toDate?.()?.getTime() || 0;
      const bTime = b.createdAt?.toDate?.()?.getTime() || 0;
      return aTime - bTime;
    });
    // Assign the next sequential ID
    contractId = sortedMovies.length.toString();
  }
  
  await setDoc(movieRef, {
    ...movieData,
    contractId: contractId,
    votes: {
      yes: 0,
      no: 0
    },
    commentCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  }, { merge: true });
  
  return movieRef.id;
};

export const getMovie = async (tmdbId: string) => {
  const movieRef = doc(db, MOVIES_COLLECTION, tmdbId);
  const movieSnap = await getDoc(movieRef);
  
  if (movieSnap.exists()) {
    return { id: movieSnap.id, ...movieSnap.data() } as MovieData;
  }
  
  return null;
};

export const getAllMovies = async () => {
  const q = query(collection(db, MOVIES_COLLECTION));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as MovieData[];
};

/**
 * Updates a movie's vote count and records the user's vote
 * @param tmdbId TMDB ID of the movie
 * @param voteType 'yes' or 'no'
 * @param userAddress Optional user's wallet address to track the vote
 */
export const updateVote = async (tmdbId: string, voteType: 'yes' | 'no', userAddress?: string) => {
  console.log('updateVote called with:', { tmdbId, voteType, userAddress });
  const movieRef = doc(db, MOVIES_COLLECTION, tmdbId);
  
  try {
    // Update the movie's vote count
    console.log('Updating movie vote count...');
    await updateDoc(movieRef, {
      [`votes.${voteType}`]: increment(1),
      updatedAt: serverTimestamp()
    });
    console.log('Successfully updated movie vote count');
    
    // If user address is provided, save their vote
    if (userAddress) {
      console.log('Saving user vote...');
      await saveUserVote(userAddress, tmdbId, voteType, false); // false for movies
      console.log('Successfully saved user vote');
    } else {
      console.log('No user address provided, skipping user vote save');
    }
  } catch (error) {
    console.error('Error in updateVote:', error);
    throw error;
  }
};

export const searchMovies = async (searchTerm: string) => {
  const q = query(
    collection(db, MOVIES_COLLECTION),
    where('title', '>=', searchTerm),
    where('title', '<=', searchTerm + '\uf8ff')
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as MovieData[];
};

/**
 * Updates a movie's contract ID in Firestore
 * @param tmdbId TMDB ID of the movie (used as document ID)
 * @param contractId The contract movie ID (sequential integer)
 */
export const updateMovieContractId = async (tmdbId: string, contractId: string | number): Promise<void> => {
  const movieRef = doc(db, MOVIES_COLLECTION, tmdbId);
  
  try {
    await updateDoc(movieRef, {
      contractId: contractId.toString(),
      updatedAt: serverTimestamp()
    });
    console.log(`Updated contract ID for movie ${tmdbId}: ${contractId}`);
  } catch (error) {
    console.error(`Error updating contract ID for movie ${tmdbId}:`, error);
    throw error;
  }
};

// Collections
const TV_SHOWS_COLLECTION = 'tvShows';
const USER_VOTES_COLLECTION = 'userVotes';

export interface TVShowData extends Omit<MovieData, 'isTVShow' | 'tmdbId'> {
  tmdbId: string;
  isTVShow: true;
  contractId?: string; // Contract TV show ID (sequential integer as string)
  firstAirDate?: string;
  lastAirDate?: string;
  numberOfSeasons?: number;
  numberOfEpisodes?: number;
}

export const saveTVShow = async (showData: Omit<TVShowData, 'createdAt' | 'updatedAt' | 'votes'>) => {
  const showRef = doc(db, TV_SHOWS_COLLECTION, showData.tmdbId);
  
  await setDoc(showRef, {
    ...showData,
    votes: {
      yes: 0,
      no: 0
    },
    commentCount: 0,
    isTVShow: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  }, { merge: true });
  
  return showRef.id;
};

export const getTVShow = async (tmdbId: string) => {
  const showRef = doc(db, TV_SHOWS_COLLECTION, tmdbId);
  const showSnap = await getDoc(showRef);
  
  if (showSnap.exists()) {
    return { id: showSnap.id, ...showSnap.data() } as TVShowData;
  }
  
  return null;
};

export const getAllTVShows = async () => {
  const q = query(collection(db, TV_SHOWS_COLLECTION));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as TVShowData[];
};

/**
 * Saves a user's vote for a movie or TV show
 * @param userAddress User's wallet address or Farcaster ID
 * @param tmdbId TMDB ID of the movie or TV show
 * @param voteType 'yes' or 'no'
 * @param isTVShow Whether this is a TV show (default: false)
 * @returns Promise that resolves when the vote is saved
 */
export const saveUserVote = async (
  userAddress: string, 
  tmdbId: string, 
  voteType: 'yes' | 'no',
  isTVShow: boolean = false
): Promise<void> => {
  console.log('saveUserVote called with:', { userAddress, tmdbId, voteType, isTVShow });
  const voteId = `${userAddress}_${tmdbId}`;
  const voteRef = doc(db, USER_VOTES_COLLECTION, voteId);
  
  try {
    console.log('Saving vote to Firestore with ID:', voteId);
    await setDoc(voteRef, {
      userAddress,
      tmdbId,
      voteType,
      isTVShow,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true });
    console.log('Successfully saved vote to Firestore');
  } catch (error) {
    console.error('Error in saveUserVote:', error);
    throw error;
  }
};

/**
 * Gets a user's vote for a specific movie or TV show
 * @param userAddress User's wallet address or Farcaster ID
 * @param tmdbId TMDB ID of the movie or TV show
 * @param isTVShow Whether to check for a TV show vote (default: false)
 * @returns The user's vote ('yes' or 'no') or null if not voted
 */
export const getUserVote = async (
  userAddress: string, 
  tmdbId: string, 
  isTVShow: boolean = false
): Promise<'yes' | 'no' | null> => {
  const voteRef = doc(db, USER_VOTES_COLLECTION, `${userAddress}_${tmdbId}`);
  const voteSnap = await getDoc(voteRef);
  
  if (voteSnap.exists()) {
    const voteData = voteSnap.data();
    // Only return the vote if it matches the requested type (movie or TV show)
    if (voteData.isTVShow === isTVShow) {
      return voteData.voteType;
    }
  }
  
  return null;
};

/**
 * Updates a TV show's vote count and records the user's vote
 * @param tmdbId TMDB ID of the TV show
 * @param voteType 'yes' or 'no'
 * @param userAddress Optional user's wallet address to track the vote
 */
export const updateTVShowVote = async (tmdbId: string, voteType: 'yes' | 'no', userAddress?: string) => {
  const showRef = doc(db, TV_SHOWS_COLLECTION, tmdbId);
  
  // Update the show's vote count
  await updateDoc(showRef, {
    [`votes.${voteType}`]: increment(1),
    updatedAt: serverTimestamp()
  });
  
  // If user address is provided, save their vote
  if (userAddress) {
    await saveUserVote(userAddress, tmdbId, voteType, true); // true for TV shows
  }
};

/**
 * Updates a TV show's contract ID in Firestore
 * @param tmdbId TMDB ID of the TV show (used as document ID)
 * @param contractId The contract TV show ID (sequential integer)
 */
export const updateTVShowContractId = async (tmdbId: string, contractId: string | number): Promise<void> => {
  const showRef = doc(db, TV_SHOWS_COLLECTION, tmdbId);
  
  try {
    await updateDoc(showRef, {
      contractId: contractId.toString(),
      updatedAt: serverTimestamp()
    });
    console.log(`Updated contract ID for TV show ${tmdbId}: ${contractId}`);
  } catch (error) {
    console.error(`Error updating contract ID for TV show ${tmdbId}:`, error);
    throw error;
  }
};

// Watchlist functions for Firestore
const WATCHLIST_COLLECTION = 'watchlist';

/**
 * Adds a movie or TV show to a user's watchlist in Firestore
 * @param address User's wallet address
 * @param tmdbId TMDB ID of the movie or TV show
 * @param movieTitle Optional title for notifications
 */
export const addToWatchlistFirestore = async (address: string, tmdbId: string, movieTitle?: string): Promise<void> => {
  const watchlistId = `${address}_${tmdbId}`;
  const watchlistRef = doc(db, WATCHLIST_COLLECTION, watchlistId);
  
  try {
    // Check if already exists
    const existing = await getDoc(watchlistRef);
    if (existing.exists()) {
      throw new Error('Movie already in watchlist');
    }
    
    await setDoc(watchlistRef, {
      address: address.toLowerCase(),
      tmdbId,
      movieTitle: movieTitle || null,
      addedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    console.log(`Added ${tmdbId} to watchlist for ${address}`);
  } catch (error: any) {
    if (error.message?.includes('already in watchlist')) {
      throw error;
    }
    console.error('Error adding to watchlist:', error);
    throw new Error(`Failed to add to watchlist: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Removes a movie or TV show from a user's watchlist in Firestore
 * @param address User's wallet address
 * @param tmdbId TMDB ID of the movie or TV show
 */
export const removeFromWatchlistFirestore = async (address: string, tmdbId: string): Promise<void> => {
  const watchlistId = `${address}_${tmdbId}`;
  const watchlistRef = doc(db, WATCHLIST_COLLECTION, watchlistId);
  
  try {
    await deleteDoc(watchlistRef);
    console.log(`Removed ${tmdbId} from watchlist for ${address}`);
  } catch (error) {
    console.error('Error removing from watchlist:', error);
    throw new Error(`Failed to remove from watchlist: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Checks if a movie or TV show is in a user's watchlist
 * @param address User's wallet address
 * @param tmdbId TMDB ID of the movie or TV show
 * @returns true if in watchlist, false otherwise
 */
export const isInWatchlistFirestore = async (address: string, tmdbId: string): Promise<boolean> => {
  const watchlistId = `${address}_${tmdbId}`;
  const watchlistRef = doc(db, WATCHLIST_COLLECTION, watchlistId);
  
  try {
    const snapshot = await getDoc(watchlistRef);
    return snapshot.exists();
  } catch (error) {
    console.error('Error checking watchlist:', error);
    return false;
  }
};

/**
 * Gets all movies/TV shows in a user's watchlist
 * @param address User's wallet address
 * @returns Array of movie/TV show data
 */
export const getUserWatchlistFirestore = async (address: string): Promise<MovieData[]> => {
  try {
    const q = query(
      collection(db, WATCHLIST_COLLECTION),
      where('address', '==', address.toLowerCase())
    );
    
    const querySnapshot = await getDocs(q);
    console.log(`Found ${querySnapshot.size} watchlist items for ${address}`);
    
    if (querySnapshot.empty) {
      return [];
    }
    
    const tmdbIds = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return data.tmdbId;
    }).filter(Boolean);
    
    console.log(`Fetching data for ${tmdbIds.length} movies/TV shows:`, tmdbIds);
    
    // Fetch movie/TV show data for each ID
    const moviePromises = tmdbIds.map(async (tmdbId) => {
      // Try movies first
      const movieRef = doc(db, MOVIES_COLLECTION, tmdbId);
      const movieSnap = await getDoc(movieRef);
      
      if (movieSnap.exists()) {
        const movieData = { id: movieSnap.id, ...movieSnap.data() } as MovieData;
        console.log(`Found movie: ${movieData.title} (${movieData.id})`);
        return movieData;
      }
      
      // Try TV shows
      const tvRef = doc(db, TV_SHOWS_COLLECTION, tmdbId);
      const tvSnap = await getDoc(tvRef);
      
      if (tvSnap.exists()) {
        const tvData = { id: tvSnap.id, ...tvSnap.data() } as MovieData;
        console.log(`Found TV show: ${tvData.title} (${tvData.id})`);
        return tvData;
      }
      
      console.warn(`Movie/TV show with TMDB ID ${tmdbId} not found in Firestore`);
      return null;
    });
    
    const movies = await Promise.all(moviePromises);
    const validMovies = movies.filter((m): m is MovieData => m !== null);
    console.log(`Returning ${validMovies.length} valid movies/TV shows`);
    return validMovies;
  } catch (error) {
    console.error('Error getting user watchlist:', error);
    return [];
  }
};

/**
 * Adds a comment to a movie or TV show.
 */
export const addComment = async (
  movieId: string,
  address: string,
  content: string,
  isTVShow: boolean = false
): Promise<CommentData> => {
  const normalizedAddress = address.toLowerCase();
  const timestampIso = new Date().toISOString();
  const commentData = {
    movieId,
    address: normalizedAddress,
    content,
    isTVShow,
    likes: [] as string[],
    replies: [] as CommentReply[],
    timestamp: timestampIso,
    createdAt: serverTimestamp()
  };

  const commentRef = await addDoc(collection(db, COMMENTS_COLLECTION), commentData);

  const targetCollection = isTVShow ? TV_SHOWS_COLLECTION : MOVIES_COLLECTION;
  const targetRef = doc(db, targetCollection, movieId);
  await updateDoc(targetRef, {
    commentCount: increment(1),
    updatedAt: serverTimestamp()
  }).catch(() => {
    console.warn(`Unable to increment comment count for ${movieId}`);
  });

  return {
    id: commentRef.id,
    _id: commentRef.id,
    movieId,
    address: normalizedAddress,
    content,
    isTVShow,
    likes: [],
    replies: [],
    timestamp: timestampIso,
    createdAt: timestampIso
  };
};

/**
 * Returns comments for a specific movie/TV show.
 */
export const getMovieComments = async (movieId: string, isTVShow: boolean = false): Promise<CommentData[]> => {
  try {
    const commentsQuery = query(
      collection(db, COMMENTS_COLLECTION),
      where('movieId', '==', movieId),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const snapshot = await getDocs(commentsQuery);

    return snapshot.docs
      .map((docSnap) => {
        const data = docSnap.data() as Record<string, any>;
        if (data.isTVShow !== undefined && data.isTVShow !== isTVShow) {
          return null;
        }

        return {
          id: docSnap.id,
          _id: docSnap.id,
          movieId: data.movieId,
          address: data.address,
          content: data.content,
          isTVShow: data.isTVShow,
          likes: data.likes || [],
          replies: data.replies || [],
          timestamp: data.timestamp || serializeTimestamp(data.createdAt),
          createdAt: data.createdAt
        } as CommentData;
      })
      .filter((comment): comment is CommentData => comment !== null);
  } catch (error) {
    console.error('Error fetching comments from Firestore:', error);
    return [];
  }
};

/**
 * Returns the latest comments with the related movie metadata.
 */
export const getLatestComments = async (limitCount: number = 5) => {
  const latestQuery = query(
    collection(db, COMMENTS_COLLECTION),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );

  const snapshot = await getDocs(latestQuery);

  const comments = await Promise.all(snapshot.docs.map(async (docSnap) => {
    const data = docSnap.data() as Record<string, any>;
    const isTVShow = Boolean(data.isTVShow);
    const targetCollection = isTVShow ? TV_SHOWS_COLLECTION : MOVIES_COLLECTION;
    const targetRef = doc(db, targetCollection, data.movieId);
    const targetSnap = await getDoc(targetRef);

    const targetData = targetSnap.exists() ? targetSnap.data() as Record<string, any> : {};

    return {
      id: docSnap.id,
      content: data.content,
      address: data.address,
      movieTitle: targetData.title || 'Unknown Title',
      moviePoster: targetData.posterUrl || null,
      createdAt: serializeTimestamp(data.createdAt),
      likesCount: Array.isArray(data.likes) ? data.likes.length : 0
    };
  }));

  return comments;
};

/**
 * Toggles the like state for a comment.
 */
export const likeComment = async (commentId: string, address: string): Promise<void> => {
  const normalizedAddress = address.toLowerCase();
  const commentRef = doc(db, COMMENTS_COLLECTION, commentId);

  await runTransaction(db, async (transaction) => {
    const commentSnap = await transaction.get(commentRef);
    if (!commentSnap.exists()) {
      throw new Error('Comment not found');
    }

    const data = commentSnap.data() as Record<string, any>;
    const likes: string[] = data.likes || [];
    const hasLiked = likes.includes(normalizedAddress);

    transaction.update(commentRef, {
      likes: hasLiked ? arrayRemove(normalizedAddress) : arrayUnion(normalizedAddress),
      updatedAt: serverTimestamp()
    });
  });
};

/**
 * Adds a reply to an existing comment.
 */
export const addReply = async (commentId: string, address: string, content: string): Promise<void> => {
  const commentRef = doc(db, COMMENTS_COLLECTION, commentId);
  const reply = {
    address: address.toLowerCase(),
    content,
    timestamp: new Date().toISOString(),
    likes: [] as string[]
  };

  await updateDoc(commentRef, {
    replies: arrayUnion(reply),
    updatedAt: serverTimestamp()
  });
};

// Points collection
const POINTS_COLLECTION = 'userPoints';

const normalizeAddress = (value: string) => value.toLowerCase();

export const addVotePoints = async (address: string): Promise<void> => {
  const ref = doc(db, POINTS_COLLECTION, normalizeAddress(address));
  await setDoc(ref, {
    address: normalizeAddress(address),
    totalPoints: increment(1),
    votePoints: increment(1),
    lastUpdated: serverTimestamp()
  }, { merge: true });
};

export const addCommentPoints = async (address: string): Promise<void> => {
  const ref = doc(db, POINTS_COLLECTION, normalizeAddress(address));
  await setDoc(ref, {
    address: normalizeAddress(address),
    totalPoints: increment(2),
    commentPoints: increment(2),
    lastUpdated: serverTimestamp()
  }, { merge: true });
};

export const getUserPoints = async (address: string): Promise<PointsData | null> => {
  const ref = doc(db, POINTS_COLLECTION, normalizeAddress(address));
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    return null;
  }

  const data = snap.data() as Record<string, any>;
  return {
    address: data.address || normalizeAddress(address),
    totalPoints: data.totalPoints || 0,
    votePoints: data.votePoints || 0,
    commentPoints: data.commentPoints || 0,
    lastUpdated: serializeTimestamp(data.lastUpdated)
  };
};

export const getAllUserPoints = async (): Promise<PointsData[]> => {
  const q = query(collection(db, POINTS_COLLECTION), orderBy('totalPoints', 'desc'));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((docSnap) => {
    const data = docSnap.data() as Record<string, any>;
    return {
      address: data.address || docSnap.id,
      totalPoints: data.totalPoints || 0,
      votePoints: data.votePoints || 0,
      commentPoints: data.commentPoints || 0,
      lastUpdated: serializeTimestamp(data.lastUpdated)
    };
  });
};

// Notification helpers
export const getUserNotificationDetails = async (fid: number): Promise<FrameNotificationDetails | null> => {
  const ref = doc(db, NOTIFICATIONS_COLLECTION, fid.toString());
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    return null;
  }
  const data = snap.data() as Record<string, any>;
  return data.details || null;
};

export const setUserNotificationDetails = async (
  fid: number,
  notificationDetails: FrameNotificationDetails
): Promise<void> => {
  const ref = doc(db, NOTIFICATIONS_COLLECTION, fid.toString());
  await setDoc(ref, {
    fid,
    details: notificationDetails,
    updatedAt: serverTimestamp(),
    createdAt: serverTimestamp()
  }, { merge: true });
};

export const deleteUserNotificationDetails = async (fid: number): Promise<void> => {
  const ref = doc(db, NOTIFICATIONS_COLLECTION, fid.toString());
  await deleteDoc(ref);
};

// Maintenance helpers
const deleteRecentDocuments = async (collectionName: string, hours: number): Promise<number> => {
  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
  const cutoffTimestamp = Timestamp.fromDate(cutoff);
  const q = query(
    collection(db, collectionName),
    where('createdAt', '>=', cutoffTimestamp)
  );

  const snapshot = await getDocs(q);
  await Promise.all(snapshot.docs.map((docSnap) => deleteDoc(doc(db, collectionName, docSnap.id))));
  return snapshot.size;
};

export const deleteRecentMovies = async (hours: number = 48): Promise<number> => {
  return deleteRecentDocuments(MOVIES_COLLECTION, hours);
};

export const deleteRecentTVShows = async (hours: number = 48): Promise<number> => {
  return deleteRecentDocuments(TV_SHOWS_COLLECTION, hours);
};

export const updatePosterUrl = async (tmdbId: string, posterUrl: string, isTVShow: boolean = false): Promise<void> => {
  const targetCollection = isTVShow ? TV_SHOWS_COLLECTION : MOVIES_COLLECTION;
  const ref = doc(db, targetCollection, tmdbId);
  await updateDoc(ref, {
    posterUrl,
    updatedAt: serverTimestamp()
  });
};

export const testFirestoreConnection = async (): Promise<void> => {
  await getDocs(query(collection(db, MOVIES_COLLECTION), limit(1)));
};
