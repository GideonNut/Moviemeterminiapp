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

interface MovieData {
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

// TV Shows Collection
const TV_SHOWS_COLLECTION = 'tvShows';

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

export const updateTVShowVote = async (tmdbId: string, voteType: 'yes' | 'no') => {
  const showRef = doc(db, TV_SHOWS_COLLECTION, tmdbId);
  
  await updateDoc(showRef, {
    [`votes.${voteType}`]: increment(1),
    updatedAt: serverTimestamp()
  });
};
