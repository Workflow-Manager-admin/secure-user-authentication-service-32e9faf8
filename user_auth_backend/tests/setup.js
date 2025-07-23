// Mock environment for testing
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-12345';
process.env.JWT_EXPIRES_IN = '1h';
process.env.BCRYPT_ROUNDS = '1';

// Create a mock schema class
class MockSchema {
  constructor(definition, options) {
    this.definition = definition;
    this.options = options;
    this.preHooks = [];
    this.methods = {};
  }

  pre(event, fn) {
    this.preHooks.push({ event, fn });
    return this;
  }
}

// Mock mongoose to avoid database connection issues
jest.mock('mongoose', () => ({
  connect: jest.fn().mockResolvedValue(true),
  disconnect: jest.fn().mockResolvedValue(true),
  connection: {
    readyState: 1,
    dropDatabase: jest.fn().mockResolvedValue(true),
    close: jest.fn().mockResolvedValue(true),
    collections: {},
    on: jest.fn(),
    states: { 1: 'connected' }
  },
  model: jest.fn().mockReturnValue(jest.fn()),
  Schema: MockSchema
}));

// Mock the database service
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

console.log('Test environment setup complete - using mocked database operations');
