import { db } from './firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  serverTimestamp,
  updateDoc,
  increment,
  deleteDoc
} from 'firebase/firestore';

const MOVIES_COLLECTION = 'movies';

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

export const saveMovie = async (movieData: Omit<MovieData, 'createdAt' | 'updatedAt' | 'votes'>) => {
  const movieRef = doc(db, MOVIES_COLLECTION, movieData.tmdbId);
  
  await setDoc(movieRef, {
    ...movieData,
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
