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
  increment
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

export const updateVote = async (tmdbId: string, voteType: 'yes' | 'no') => {
  const movieRef = doc(db, MOVIES_COLLECTION, tmdbId);
  
  await updateDoc(movieRef, {
    [`votes.${voteType}`]: increment(1),
    updatedAt: serverTimestamp()
  });
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

// Collections
const TV_SHOWS_COLLECTION = 'tvShows';
const USER_VOTES_COLLECTION = 'userVotes';

export interface TVShowData extends Omit<MovieData, 'isTVShow' | 'tmdbId'> {
  tmdbId: string;
  isTVShow: true;
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
 * Saves a user's vote for a TV show
 * @param userAddress User's wallet address
 * @param tmdbId TMDB ID of the TV show
 * @param voteType 'yes' or 'no'
 * @returns Promise that resolves when the vote is saved
 */
export const saveUserVote = async (userAddress: string, tmdbId: string, voteType: 'yes' | 'no'): Promise<void> => {
  const voteRef = doc(db, USER_VOTES_COLLECTION, `${userAddress}_${tmdbId}`);
  
  await setDoc(voteRef, {
    userAddress,
    tmdbId,
    voteType,
    isTVShow: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  }, { merge: true });
};

/**
 * Gets a user's vote for a specific TV show
 * @param userAddress User's wallet address
 * @param tmdbId TMDB ID of the TV show
 * @returns The user's vote ('yes' or 'no') or null if not voted
 */
export const getUserVote = async (userAddress: string, tmdbId: string): Promise<'yes' | 'no' | null> => {
  const voteRef = doc(db, USER_VOTES_COLLECTION, `${userAddress}_${tmdbId}`);
  const voteSnap = await getDoc(voteRef);
  
  if (voteSnap.exists()) {
    return voteSnap.data().voteType;
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
    await saveUserVote(userAddress, tmdbId, voteType);
  }
};
