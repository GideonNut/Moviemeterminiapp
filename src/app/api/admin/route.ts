import { NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "~/auth";
import { adminDb } from "~/lib/firebase-admin";
import { Timestamp } from "firebase-admin/firestore";

export const runtime = "nodejs";

// Helper function to get Firestore collection reference
const getContentCollection = (isTVShow: boolean) => 
  adminDb.collection(isTVShow ? 'tvShows' : 'movies');

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return Response.json(
        { success: false, error: 'Not authenticated' }, 
        { status: 401 }
      );
    }

    // Only allow admin users
    if (session.user.email !== process.env.ADMIN_EMAIL) {
      return Response.json(
        { success: false, error: 'Not authorized' },
        { status: 403 }
      );
    }

    // Get counts for movies and TV shows
    const [moviesSnapshot, tvShowsSnapshot] = await Promise.all([
      adminDb.collection('movies').count().get(),
      adminDb.collection('tvShows').count().get()
    ]);

    return Response.json({
      success: true,
      counts: {
        movies: moviesSnapshot.data().count,
        tvShows: tvShowsSnapshot.data().count
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
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return Response.json(
        { success: false, error: 'Not authenticated' }, 
        { status: 401 }
      );
    }

    // Only allow admin users
    if (session.user.email !== process.env.ADMIN_EMAIL) {
      return Response.json(
        { success: false, error: 'Not authorized' },
        { status: 403 }
      );
    }

    const body = await request.json();
    
    if (body.action === 'import') {
      // Handle bulk import
      const { items, type } = body;
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
          addedBy: session.user.email
        };
        batch.set(ref, data, { merge: true });
      });
      
      await batch.commit();
      return Response.json({ success: true, count: items.length });
      
    } else if (body.action === 'reset-ids') {
      // Reset IDs to be sequential (if needed)
      // Note: Firestore uses auto-generated IDs, so this might not be necessary
      return Response.json({ 
        success: true, 
        message: 'Firestore uses auto-generated IDs. No reset needed.' 
      });
      
    } else if (body.action === 'retract-recent') {
      // Retract recently added content (last 48 hours)
      const { type } = body;
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
