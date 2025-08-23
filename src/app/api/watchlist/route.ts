import { NextRequest, NextResponse } from 'next/server';
import { addToWatchlist, removeFromWatchlist, getUserWatchlist, isInWatchlist } from '~/lib/mongo';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');
    const movieId = searchParams.get('movieId');

    if (!address) {
      return NextResponse.json({ error: 'Address is required' }, { status: 400 });
    }

    if (movieId) {
      // Check if specific movie is in watchlist
      const inWatchlist = await isInWatchlist(address, movieId);
      return NextResponse.json({ inWatchlist });
    } else {
      // Get user's entire watchlist
      const watchlist = await getUserWatchlist(address);
      return NextResponse.json(watchlist);
    }
  } catch (error) {
    console.error('Error in watchlist GET:', error);
    return NextResponse.json(
      { error: 'Failed to fetch watchlist' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { address, movieId } = await request.json();

    if (!address || !movieId) {
      return NextResponse.json(
        { error: 'Address and movieId are required' },
        { status: 400 }
      );
    }

    await addToWatchlist(address, movieId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error adding to watchlist:', error);
    
    if (error.message?.includes('already in watchlist')) {
      return NextResponse.json(
        { error: 'Movie already in watchlist' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to add to watchlist' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');
    const movieId = searchParams.get('movieId');

    if (!address || !movieId) {
      return NextResponse.json(
        { error: 'Address and movieId are required' },
        { status: 400 }
      );
    }

    await removeFromWatchlist(address, movieId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing from watchlist:', error);
    return NextResponse.json(
      { error: 'Failed to remove from watchlist' },
      { status: 500 }
    );
  }
}