// Set environment variables before importing modules
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-12345';
process.env.JWT_EXPIRES_IN = '1h';
process.env.BCRYPT_ROUNDS = '1';

const request = require('supertest');
const mongoose = require('mongoose');

// Mock the entire database service to avoid connection issues
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

// Mock User model with proper methods
jest.mock('../src/models/User', () => {
  const mockUser = jest.fn().mockImplementation((userData) => ({
    ...userData,
    _id: '507f1f77bcf86cd799439011',
    save: jest.fn().mockResolvedValue(true),
    toJSON: jest.fn().mockReturnValue({
      _id: '507f1f77bcf86cd799439011',
      email: userData.email,
      name: userData.name,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    })
  }));

  mockUser.findOne = jest.fn();
  mockUser.findById = jest.fn();
  mockUser.findOneAndUpdate = jest.fn();
  
  return mockUser;
});

const app = require('../src/app');
const User = require('../src/models/User');

describe('Authentication Endpoints Integration Tests', () => {
  const validUser = {
    email: 'test@example.com',
    password: 'Test123456',
    name: 'Test User'
  };

  const mockUserData = {
    _id: '507f1f77bcf86cd799439011',
    email: validUser.email,
    name: validUser.name,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /auth/register', () => {
    it('should register a new user successfully', async () => {
      // Mock user doesn't exist
      User.findOne.mockResolvedValue(null);
      
      // Mock user creation
      const mockUser = {
        ...mockUserData,
        save: jest.fn().mockResolvedValue(true),
        toJSON: jest.fn().mockReturnValue(mockUserData)
      };
      User.mockImplementation(() => mockUser);

      const response = await request(app)
        .post('/auth/register')
        .send(validUser)
        .expect(201);

      expect(response.body.status).toBe('success');
      expect(response.body.message).toBe('User registered successfully');
      expect(response.body.data.user.email).toBe(validUser.email);
      expect(response.body.data.user.name).toBe(validUser.name);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.password).toBeUndefined();
    });

    it('should not register user with invalid email', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          ...validUser,
          email: 'invalid-email'
        })
        .expect(400);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Validation failed');
      expect(response.body.errors).toBeDefined();
    });

    it('should not register user with weak password', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          ...validUser,
          password: '123'
        })
        .expect(400);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Validation failed');
    });

    it('should not register user with invalid name', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          ...validUser,
          name: 'A' // Too short
        })
        .expect(400);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Validation failed');
    });

    it('should not register duplicate user', async () => {
      // Mock user exists
      User.findOne.mockResolvedValue(mockUserData);

      const response = await request(app)
        .post('/auth/register')
        .send(validUser)
        .expect(409);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('User already exists with this email');
    });

    it('should handle database errors gracefully', async () => {
      User.findOne.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .post('/auth/register')
        .send(validUser)
        .expect(500);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Registration failed');
    });
  });

  describe('POST /auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const mockUser = {
        ...mockUserData,
        comparePassword: jest.fn().mockResolvedValue(true),
        save: jest.fn().mockResolvedValue(true),
        toJSON: jest.fn().mockReturnValue(mockUserData)
      };
      
      User.findOne.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/auth/login')
        .send({
          email: validUser.email,
          password: validUser.password
        })
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.message).toBe('Login successful');
      expect(response.body.data.user.email).toBe(validUser.email);
      expect(response.body.data.token).toBeDefined();
    });

    it('should not login with invalid email', async () => {
      User.findOne.mockResolvedValue(null);

      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: validUser.password
        })
        .expect(401);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Invalid email or password');
    });

    it('should not login with invalid password', async () => {
      const mockUser = {
        ...mockUserData,
        comparePassword: jest.fn().mockResolvedValue(false)
      };
      
      User.findOne.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/auth/login')
        .send({
          email: validUser.email,
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Invalid email or password');
    });

    it('should not login with deactivated account', async () => {
      const mockUser = {
        ...mockUserData,
        isActive: false
      };
      
      User.findOne.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/auth/login')
        .send({
          email: validUser.email,
          password: validUser.password
        })
        .expect(401);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Account is deactivated');
    });

    it('should handle validation errors', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'invalid-email',
          password: ''
        })
        .expect(400);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Validation failed');
    });
  });

  describe('GET /auth/profile', () => {
    const jwt = require('jsonwebtoken');
    
    it('should get profile with valid token', async () => {
      const token = jwt.sign(
        { userId: mockUserData._id, email: mockUserData.email, name: mockUserData.name },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      User.findById.mockResolvedValue({
        toJSON: () => mockUserData
      });

      const response = await request(app)
        .get('/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.message).toBe('Profile retrieved successfully');
      expect(response.body.data.user.email).toBe(mockUserData.email);
      expect(response.body.data.user.password).toBeUndefined();
    });

    it('should not get profile without token', async () => {
      const response = await request(app)
        .get('/auth/profile')
        .expect(401);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Access token is required');
    });

    it('should not get profile with invalid token', async () => {
      const response = await request(app)
        .get('/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Invalid token');
    });

    it('should not get profile with expired token', async () => {
      const expiredToken = jwt.sign(
        { userId: mockUserData._id, email: mockUserData.email, name: mockUserData.name },
        process.env.JWT_SECRET,
        { expiresIn: '-1h' } // Expired token
      );

      const response = await request(app)
        .get('/auth/profile')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Token expired');
    });

    it('should handle user not found', async () => {
      const token = jwt.sign(
        { userId: mockUserData._id, email: mockUserData.email, name: mockUserData.name },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      User.findById.mockResolvedValue(null);

      const response = await request(app)
        .get('/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('User not found');
    });
  });

  describe('POST /auth/logout', () => {
    const jwt = require('jsonwebtoken');
    
    it('should logout successfully with valid token', async () => {
      const token = jwt.sign(
        { userId: mockUserData._id, email: mockUserData.email, name: mockUserData.name },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .post('/auth/logout')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.message).toBe('Logout successful. Please remove token from client side.');
    });

    it('should not logout without token', async () => {
      const response = await request(app)
        .post('/auth/logout')
        .expect(401);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Access token is required');
    });
  });
});

describe('Health Endpoint', () => {
  describe('GET /', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      expect(response.body.status).toBe('ok');
      expect(response.body.message).toBe('Service is healthy');
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.environment).toBe('test');
    });
  });
});
