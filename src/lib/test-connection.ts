import { connectMongo, disconnectMongo } from './mongo';

async function testConnection() {
  try {
    console.log('Testing MongoDB connection with Mongoose...');
    
    // Test connection
    const connection = await connectMongo();
    console.log('✅ Connection successful!');
    console.log('Connection state:', connection.readyState);
    if (connection.db) {
      console.log('Database name:', connection.db.databaseName);
    }
    
    // Test disconnection
    await disconnectMongo();
    console.log('✅ Disconnection successful!');
    
  } catch (error) {
    console.error('❌ Connection test failed:', error);
  }
}

// Run the test
testConnection();
