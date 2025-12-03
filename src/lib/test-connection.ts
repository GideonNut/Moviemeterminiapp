import { testFirestoreConnection } from './firestore';

async function testConnection() {
  try {
    console.log('Testing Firestore connection...');
    await testFirestoreConnection();
    console.log('✅ Firestore connection successful!');
  } catch (error) {
    console.error('❌ Firestore connection test failed:', error);
  }
}

testConnection();
