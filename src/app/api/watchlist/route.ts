import { NextRequest, NextResponse } from 'next/server';
import { 
  addToWatchlistFirestore, 
  removeFromWatchlistFirestore, 
  getUserWatchlistFirestore, 
  isInWatchlistFirestore 
} from '~/lib/firestore';
import { lookupFidByCustodyAddress } from '~/lib/farcaster';
import { sendFrameNotification } from '~/lib/notifs';

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
      // movieId is the TMDB ID (e.g., "23934")
      const inWatchlist = await isInWatchlistFirestore(address, movieId);
      return NextResponse.json({ inWatchlist });
    } else {
      // Get user's entire watchlist
      const watchlist = await getUserWatchlistFirestore(address);
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
    const { address, movieId, movieTitle } = await request.json();

    if (!address || !movieId) {
      return NextResponse.json(
        { error: 'Address and movieId are required' },
        { status: 400 }
      );
    }

    // movieId is the TMDB ID from Firestore
    await addToWatchlistFirestore(address, movieId, movieTitle);
    
    // Try to send notification if user has Farcaster account
    try {
      const fid = await lookupFidByCustodyAddress(address);
      if (fid) {
        const title = "Movie Added to Watchlist";
        const body = movieTitle 
          ? `"${movieTitle}" has been added to your watchlist!`
          : "A movie has been added to your watchlist!";
        
        await sendFrameNotification({ fid, title, body });
        console.log(`Notification sent to FID ${fid} for watchlist addition`);
      }
    } catch (notificationError) {
      // Don't fail the request if notification fails
      console.log('Could not send notification for watchlist addition:', notificationError);
    }
    
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

    // movieId is the TMDB ID from Firestore
    await removeFromWatchlistFirestore(address, movieId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing from watchlist:', error);
    return NextResponse.json(
      { error: 'Failed to remove from watchlist' },
      { status: 500 }
    );
  }
}