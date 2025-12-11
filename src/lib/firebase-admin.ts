import { cert, getApps, initializeApp, getApp } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

// Lazy initialization function
function getAdminApp() {
  if (getApps().length > 0) {
    return getApp();
  }

  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  
  // During build time, if service account is not configured, 
  // we'll initialize with a minimal config to allow build to proceed
  // The actual operations will fail at runtime if not properly configured
  if (!serviceAccountKey || serviceAccountKey === '{}') {
    // Check if we're in build mode
    if (process.env.NEXT_PHASE === 'phase-production-build') {
      // For build time, we can't initialize without valid credentials
      // But we'll throw a more helpful error
      throw new Error(
        'FIREBASE_SERVICE_ACCOUNT_KEY is required for build. ' +
        'Please set it to a valid Firebase service account JSON string in your .env.local file.'
      );
    }
    throw new Error(
      'FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set. ' +
      'Please set it to a valid Firebase service account JSON string.'
    );
  }

  let serviceAccount;
  try {
    serviceAccount = JSON.parse(serviceAccountKey);
  } catch (error) {
    throw new Error(
      'FIREBASE_SERVICE_ACCOUNT_KEY is not valid JSON. ' +
      'Please ensure it is a properly formatted JSON string.'
    );
  }

  // Validate required fields
  if (!serviceAccount.project_id) {
    throw new Error(
      'FIREBASE_SERVICE_ACCOUNT_KEY is missing required "project_id" field. ' +
      'Please ensure your service account JSON includes all required fields: ' +
      'project_id, private_key, client_email, etc.'
    );
  }

  return initializeApp({
    credential: cert(serviceAccount)
  });
}

// Lazy getter for adminDb
let _adminDb: Firestore | null = null;

export function getAdminDb(): Firestore {
  if (!_adminDb) {
    const app = getAdminApp();
    _adminDb = getFirestore(app);
  }
  return _adminDb;
}

// Export for backward compatibility - lazy initialization
export const adminDb = new Proxy({} as Firestore, {
  get(_target, prop) {
    const db = getAdminDb();
    const value = (db as any)[prop];
    // If it's a function, bind it to the db instance
    if (typeof value === 'function') {
      return value.bind(db);
    }
    return value;
  }
}) as Firestore;

// Add any other admin utilities here
export const getContentCollection = (isTVShow: boolean) => 
  getAdminDb().collection(isTVShow ? 'tvShows' : 'movies');
