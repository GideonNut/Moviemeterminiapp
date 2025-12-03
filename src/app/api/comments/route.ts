import { NextRequest, NextResponse } from 'next/server';
import { 
  addComment, 
  getMovieComments, 
  getLatestComments,
  likeComment, 
  addReply, 
  addCommentPoints 
} from '~/lib/firestore';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const movieId = searchParams.get('movieId');
    const isTVShow = searchParams.get('isTVShow') === 'true';

    if (movieId) {
      // If movieId is provided, return comments for that specific movie/show
      const comments = await getMovieComments(movieId, isTVShow);
      return NextResponse.json(comments);
    }
    
    // If no movieId is provided, return latest comments across all movies/shows
    const latestComments = await getLatestComments();

    return NextResponse.json({ 
      success: true, 
      comments: latestComments
    });
  } catch (error) {
    console.error('Error in comments GET:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, movieId, address, content, commentId, isTVShow } = await request.json();

    if (!address) {
      return NextResponse.json(
        { error: 'Address is required' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'add':
        if (!movieId || !content) {
          return NextResponse.json(
            { error: 'ID and content are required' },
            { status: 400 }
          );
        }
        
        if (content.length > 1000) {
          return NextResponse.json(
            { error: 'Comment cannot exceed 1000 characters' },
            { status: 400 }
          );
        }

        const comment = await addComment(movieId, address, content, Boolean(isTVShow));
        // Award 2 points for commenting
        await addCommentPoints(address);
        return NextResponse.json(comment);

      case 'like':
        if (!commentId) {
          return NextResponse.json(
            { error: 'Comment ID is required' },
            { status: 400 }
          );
        }

        await likeComment(commentId, address);
        return NextResponse.json({ success: true });

      case 'reply':
        if (!commentId || !content) {
          return NextResponse.json(
            { error: 'Comment ID and content are required' },
            { status: 400 }
          );
        }

        if (content.length > 500) {
          return NextResponse.json(
            { error: 'Reply cannot exceed 500 characters' },
            { status: 400 }
          );
        }

        await addReply(commentId, address, content);
        return NextResponse.json({ success: true });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('Error in comments POST:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process comment action' },
      { status: 500 }
    );
  }
}