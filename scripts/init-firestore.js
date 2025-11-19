const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, setDoc } = require('firebase/firestore');
require('dotenv').config();

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function initializeCollections() {
  const collections = ['movies', 'tvShows', 'userVotes'];
  
  for (const collectionName of collections) {
    try {
      // Try to create a document in the collection
      const docRef = doc(collection(db, collectionName), 'test-doc');
      await setDoc(docRef, { _test: true }, { merge: true });
      console.log(`✓ Collection '${collectionName}' exists or was created successfully`);
      
      // Clean up test document
      // await deleteDoc(docRef);
    } catch (error) {
      console.error(`✗ Error with collection '${collectionName}':`, error.message);
    }
  }
  
  console.log('\nInitialization complete!');
  process.exit(0);
}

initializeCollections().catch(console.error);
