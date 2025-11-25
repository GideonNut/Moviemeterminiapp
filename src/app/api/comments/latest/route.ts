import { NextResponse } from 'next/server';
import { db } from '~/lib/firebase';
import { 
  collection, 
  getDocs, 
  query, 
  orderBy, 
  limit,
  getDoc,
  doc
} from 'firebase/firestore';

export const runtime = "nodejs";

const COMMENTS_COLLECTION = 'comments';
const MOVIES_COLLECTION = 'movies';
const TV_SHOWS_COLLECTION = 'tvShows';

export async function GET() {
  try {
    // Get latest comments from Firestore
    const commentsRef = collection(db, COMMENTS_COLLECTION);
    const commentsQuery = query(
      commentsRef,
      orderBy('timestamp', 'desc'),
      limit(5)
    );
    
    const commentsSnapshot = await getDocs(commentsQuery);
    
    // Fetch movie/show details for each comment
    const commentsWithMovies = await Promise.all(
      commentsSnapshot.docs.map(async (commentDoc) => {
        const commentData = commentDoc.data();
        const movieId = commentData.movieId;
        const isTVShow = commentData.isTVShow || false;
        
        // Get movie/show details
        let movieTitle = '';
        let moviePoster = '';
        
        try {
          const collectionName = isTVShow ? TV_SHOWS_COLLECTION : MOVIES_COLLECTION;
          const movieRef = doc(db, collectionName, movieId);
          const movieSnap = await getDoc(movieRef);
          
          if (movieSnap.exists()) {
            const movieData = movieSnap.data();
            movieTitle = movieData.title || '';
            moviePoster = movieData.posterUrl || '';
          }
        } catch (err) {
          console.error(`Error fetching movie/show ${movieId}:`, err);
        }
        
        return {
          id: commentDoc.id,
          content: commentData.content || '',
          address: commentData.address || '',
          movieTitle,
          moviePoster,
          createdAt: commentData.timestamp?.toDate?.() || commentData.timestamp || new Date(),
          likesCount: Array.isArray(commentData.likes) ? commentData.likes.length : 0,
          likes: commentData.likes || []
        };
      })
    );

    return NextResponse.json({ 
      success: true, 
      comments: commentsWithMovies
    });
  } catch (error) {
    console.error('Error fetching latest comments:', error);
    // Return empty array instead of error to prevent blocking the page
    return NextResponse.json({ 
      success: true, 
      comments: []
    });
  }
}