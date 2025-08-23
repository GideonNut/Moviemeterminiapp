import { NextRequest, NextResponse } from 'next/server';
import { addComment, getMovieComments, likeComment, addReply } from '~/lib/mongo';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const movieId = searchParams.get('movieId');

    if (!movieId) {
      return NextResponse.json({ error: 'Movie ID is required' }, { status: 400 });
    }

    const comments = await getMovieComments(movieId);
    return NextResponse.json(comments);
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
    const { action, movieId, address, content, commentId } = await request.json();

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
            { error: 'Movie ID and content are required' },
            { status: 400 }
          );
        }
        
        if (content.length > 1000) {
          return NextResponse.json(
            { error: 'Comment cannot exceed 1000 characters' },
            { status: 400 }
          );
        }

        const comment = await addComment(movieId, address, content);
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