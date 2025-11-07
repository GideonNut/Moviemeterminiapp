import { cert, getApps, initializeApp, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}');

const adminApp = getApps().length === 0
  ? initializeApp({
      credential: cert(serviceAccount)
    })
  : getApp();

export const adminDb = getFirestore(adminApp);

// Add any other admin utilities here
export const getContentCollection = (isTVShow: boolean) => 
  adminDb.collection(isTVShow ? 'tvShows' : 'movies');
