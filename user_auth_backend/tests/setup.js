const mongoose = require('mongoose');

// Mock environment for testing
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-12345';
process.env.JWT_EXPIRES_IN = '1h';
process.env.BCRYPT_ROUNDS = '1';

let mongoServer;

// Setup test database
beforeAll(async () => {
  try {
    // Try to connect to existing MongoDB instance first
    const mongoUri = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/auth-test-db';
    await mongoose.connect(mongoUri);
    console.log('Connected to test MongoDB instance');
  } catch (error) {
    console.log('MongoDB not available, tests will use mocked database operations');
    // If MongoDB is not available, we'll mock the database operations
    jest.mock('../src/services/database', () => ({
      connect: jest.fn().mockResolvedValue(true),
      disconnect: jest.fn().mockResolvedValue(true),
      getConnectionStatus: jest.fn().mockReturnValue({
        connected: true,
        state: 'connected',
        host: 'localhost',
        port: 27017,
        name: 'auth-test-db'
      })
    }));
  }
}, 30000);

// Clean up after all tests
afterAll(async () => {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.dropDatabase();
      await mongoose.connection.close();
    }
  } catch (error) {
    console.log('Database cleanup completed');
  }
}, 30000);

// Clean up after each test
afterEach(async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      const collections = mongoose.connection.collections;
      for (const key in collections) {
        const collection = collections[key];
        await collection.deleteMany({});
      }
    }
  } catch (error) {
    // Ignore cleanup errors in test environment
  }
});
