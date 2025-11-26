import { NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "~/auth";
import { adminDb } from "~/lib/firebase-admin";
import { Timestamp } from "firebase-admin/firestore";

// Extend the session type to include wallet address
declare module "next-auth" {
  interface Session {
    user: {
      fid: number;
      email?: string;
      name?: string;
      image?: string;
      address?: string;
    };
  }
}

export const runtime = "nodejs";

// Helper function to get Firestore collection reference
const getContentCollection = (isTVShow: boolean) => 
  adminDb.collection(isTVShow ? 'tvShows' : 'movies');

export async function GET() {
  try {
    console.log('Admin GET request received');
    const session = await getServerSession(authOptions);
    
    // Debug log the session
    console.log('Session in admin route:', JSON.stringify(session, null, 2));
    
    // Check for wallet authentication
    if (!session?.user?.address) {
      console.error('No wallet address in session. User might not be authenticated.');
      return Response.json(
        { 
          success: false, 
          error: 'Wallet not connected',
          sessionExists: !!session,
          hasUser: !!(session?.user),
          hasAddress: !!(session?.user?.address)
        }, 
        { status: 401 }
      );
    }

    // Only allow specific wallet addresses if ADMIN_WALLETS is configured
    // If not configured, allow any wallet (for webapp use)
    const ADMIN_WALLETS = (process.env.ADMIN_WALLETS || '').split(',').map(addr => addr.toLowerCase().trim()).filter(Boolean);
    
    // If ADMIN_WALLETS is configured, enforce the whitelist
    // If not configured, allow any wallet (for webapp/public use)
    if (ADMIN_WALLETS.length > 0 && !ADMIN_WALLETS.includes(session.user.address.toLowerCase())) {
      return Response.json(
        { success: false, error: 'Not authorized' },
        { status: 403 }
      );
    }
    
    // If ADMIN_WALLETS is not configured, log a warning but allow access
    if (ADMIN_WALLETS.length === 0) {
      console.warn('ADMIN_WALLETS not configured - allowing any wallet. For production, set ADMIN_WALLETS environment variable.');
    }

    // Get counts for movies and TV shows
    const [moviesSnapshot, tvShowsSnapshot] = await Promise.all([
      adminDb.collection('movies').get(),
      adminDb.collection('tvShows').get()
    ]);

    return Response.json({
      success: true,
      counts: {
        movies: moviesSnapshot.size,
        tvShows: tvShowsSnapshot.size
      }
    });
  } catch (error) {
    console.error('Error in admin stats:', error);
    return Response.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('Admin POST request received');
    
    // First parse the request body to get the wallet address
    const requestBody = await request.json().catch(() => ({}));
    const headers = request.headers;
    
    // Get the session
    const session = await getServerSession(authOptions);
    console.log('Session in admin POST:', JSON.stringify(session, null, 2));
    
    // Get wallet address from headers, then body, then session
    const walletAddress = (
      headers.get('x-wallet-address') || 
      requestBody?.walletAddress ||
      session?.user?.address ||
      ''
    ).toLowerCase().trim();

    // Log the wallet address source for debugging
    console.log('Wallet address source:', {
      fromHeader: !!headers.get('x-wallet-address'),
      fromBody: !!requestBody?.walletAddress,
      fromSession: !!session?.user?.address,
      finalAddress: walletAddress || 'none'
    });

    // Check for wallet authentication
    if (!walletAddress) {
      return Response.json(
        { 
          success: false, 
          error: 'Wallet address is required',
          sessionExists: !!session,
          hasUser: !!(session?.user),
          hasAddress: !!(session?.user?.address)
        }, 
        { status: 401 }
      );
    }

    // Only allow specific wallet addresses if ADMIN_WALLETS is configured
    // If not configured, allow any wallet (for webapp use)
    const ADMIN_WALLETS = (process.env.ADMIN_WALLETS || '')
      .split(',')
      .map(addr => addr.toLowerCase().trim())
      .filter(Boolean);

    console.log('Admin wallets:', ADMIN_WALLETS.length > 0 ? ADMIN_WALLETS : 'Not configured (allowing any wallet)');
    console.log('Request from wallet:', walletAddress);

    // If ADMIN_WALLETS is configured, enforce the whitelist
    // If not configured, allow any wallet (for webapp/public use)
    if (ADMIN_WALLETS.length > 0 && !ADMIN_WALLETS.includes(walletAddress)) {
      console.warn(`Unauthorized access attempt from wallet: ${walletAddress}`);
      return Response.json(
        { 
          success: false, 
          error: 'Not authorized',
          yourAddress: walletAddress,
          adminWallets: ADMIN_WALLETS
        },
        { status: 403 }
      );
    }
    
    // If ADMIN_WALLETS is not configured, log a warning but allow access
    if (ADMIN_WALLETS.length === 0) {
      console.warn('ADMIN_WALLETS not configured - allowing any wallet. For production, set ADMIN_WALLETS environment variable.');
    }

    // Use the already parsed request body
    if (requestBody.action === 'import') {
      // Handle bulk import
      const { items, type } = requestBody;
      const collection = getContentCollection(type === 'tv');
      const batch = adminDb.batch();
      
      items.forEach((item: any) => {
        const ref = collection.doc(item.id?.toString() || undefined);
        const data = {
          ...item,
          tmdbId: item.id.toString(),
          votes: { yes: 0, no: 0 },
          commentCount: 0,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          addedBy: session?.user?.email || walletAddress || 'unknown'
        };
        batch.set(ref, data, { merge: true });
      });
      
      await batch.commit();
      return Response.json({ success: true, count: items.length });
      
    } else if (requestBody.action === 'add-movie') {
      const { title, description, releaseYear, posterUrl, isTVShow } = requestBody as {
        title: string;
        description: string;
        releaseYear?: string;
        posterUrl?: string;
        isTVShow?: boolean;
      };
      
      if (!title || !description) {
        return Response.json(
          { success: false, error: 'Title and description are required' },
          { status: 400 }
        );
      }
      
      const collection = getContentCollection(!!isTVShow);
      const docRef = await collection.add({
        title,
        description,
        releaseYear: releaseYear || null,
        posterUrl: posterUrl || null,
        isTVShow: !!isTVShow,
        votes: { yes: 0, no: 0 },
        commentCount: 0,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      
      return Response.json({
        success: true,
        id: docRef.id
      });
      
    } else if (requestBody.action === 'reset-ids') {
      // Reset IDs to be sequential (if needed)
      // Note: Firestore uses auto-generated IDs, so this might not be necessary
      return Response.json({ 
        success: true, 
        message: 'Firestore uses auto-generated IDs. No reset needed.' 
      });
      
    } else if (requestBody.action === 'retract-recent') {
      // Retract recently added content (last 48 hours)
      const { type } = requestBody;
      const collection = getContentCollection(type === 'tv');
      const cutoff = new Date();
      cutoff.setHours(cutoff.getHours() - 48);
      
      const snapshot = await collection
        .where('createdAt', '>=', Timestamp.fromDate(cutoff))
        .get();
      
      const batch = adminDb.batch();
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      return Response.json({ 
        success: true, 
        count: snapshot.size,
        message: `Successfully retracted ${snapshot.size} items`
      });
    } else if (requestBody.action === 'import-trending') {
      const { type = 'movies' } = requestBody as { type?: 'movies' | 'tv' };
      
      // Import trending content from TMDB
      const response = await fetch(`${process.env.NEXTAUTH_URL}/api/import/tmdb`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'trending',
          mediaType: type,
          page: 1
        })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        return Response.json(
          { 
            success: false, 
            error: result.error || 'Failed to import trending content' 
          },
          { status: response.status }
        );
      }
      
      return Response.json({
        success: true,
        imported: result.imported || 0,
        titles: result.titles || []
      });
    }
    
    return Response.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    );
    
  } catch (error) {
    console.error('Error in admin action:', error);
    return Response.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
