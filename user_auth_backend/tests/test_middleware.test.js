// Set environment variables before importing modules
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-12345';
process.env.JWT_EXPIRES_IN = '1h';
process.env.BCRYPT_ROUNDS = '1';

const jwt = require('jsonwebtoken');

// Mock the auth service
jest.mock('../src/services/authService');

const { authenticateToken } = require('../src/middleware/auth');
const authService = require('../src/services/authService');

describe('Authentication Middleware Tests', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('authenticateToken middleware', () => {
    it('should authenticate valid Bearer token', async () => {
      const mockDecoded = {
        userId: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        name: 'Test User'
      };

      req.headers.authorization = 'Bearer valid-jwt-token';
      authService.verifyToken.mockReturnValue(mockDecoded);

      await authenticateToken(req, res, next);

      expect(authService.verifyToken).toHaveBeenCalledWith('valid-jwt-token');
      expect(req.user).toEqual(mockDecoded);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it('should authenticate token without Bearer prefix', async () => {
      const mockDecoded = {
        userId: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        name: 'Test User'
      };

      req.headers.authorization = 'valid-jwt-token';
      authService.verifyToken.mockReturnValue(mockDecoded);

      await authenticateToken(req, res, next);

      expect(authService.verifyToken).toHaveBeenCalledWith('valid-jwt-token');
      expect(req.user).toEqual(mockDecoded);
      expect(next).toHaveBeenCalled();
    });

    it('should reject request without authorization header', async () => {
      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Access token is required'
      });
      expect(next).not.toHaveBeenCalled();
      expect(authService.verifyToken).not.toHaveBeenCalled();
    });

    it('should reject request with empty authorization header', async () => {
      req.headers.authorization = '';

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Access token is required'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject request with Bearer but no token', async () => {
      req.headers.authorization = 'Bearer ';

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Access token is required'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle JsonWebTokenError', async () => {
      req.headers.authorization = 'Bearer invalid-token';
      
      const jwtError = new Error('invalid token');
      jwtError.name = 'JsonWebTokenError';
      authService.verifyToken.mockImplementation(() => {
        throw jwtError;
      });

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Invalid token'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle TokenExpiredError', async () => {
      req.headers.authorization = 'Bearer expired-token';
      
      const expiredError = new Error('jwt expired');
      expiredError.name = 'TokenExpiredError';
      authService.verifyToken.mockImplementation(() => {
        throw expiredError;
      });

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Token expired'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle general token verification errors', async () => {
      req.headers.authorization = 'Bearer some-token';
      
      const generalError = new Error('Token verification failed');
      authService.verifyToken.mockImplementation(() => {
        throw generalError;
      });

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Token verification failed'
      });
      expect(next).not.toHaveBeenCalled();
    });
  });
});

describe('Validation Middleware Tests', () => {
  const { body, validationResult } = require('express-validator');
  const { registerValidation, loginValidation } = require('../src/middleware/validation');

  describe('registerValidation', () => {
    it('should validate email format', () => {
      const emailValidation = registerValidation.find(v => 
        v.builder && v.builder.fields && v.builder.fields.includes('email')
      );
      expect(emailValidation).toBeDefined();
    });

    it('should validate password requirements', () => {
      const passwordValidation = registerValidation.find(v => 
        v.builder && v.builder.fields && v.builder.fields.includes('password')
      );
      expect(passwordValidation).toBeDefined();
    });

    it('should validate name requirements', () => {
      const nameValidation = registerValidation.find(v => 
        v.builder && v.builder.fields && v.builder.fields.includes('name')
      );
      expect(nameValidation).toBeDefined();
    });
  });

  describe('loginValidation', () => {
    it('should validate email format for login', () => {
      const emailValidation = loginValidation.find(v => 
        v.builder && v.builder.fields && v.builder.fields.includes('email')
      );
      expect(emailValidation).toBeDefined();
    });

    it('should validate password presence for login', () => {
      const passwordValidation = loginValidation.find(v => 
        v.builder && v.builder.fields && v.builder.fields.includes('password')
      );
      expect(passwordValidation).toBeDefined();
    });
  });
});

describe('Real JWT Integration Tests', () => {
  describe('JWT token flow', () => {
    it('should create and verify tokens using real JWT', () => {
      const payload = {
        userId: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        name: 'Test User'
      };

      // Create token
      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.email).toBe(payload.email);
      expect(decoded.name).toBe(payload.name);
    });

    it('should reject expired tokens', () => {
      const payload = {
        userId: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        name: 'Test User'
      };

      const expiredToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '-1h' });
      
      expect(() => {
        jwt.verify(expiredToken, process.env.JWT_SECRET);
      }).toThrow('jwt expired');
    });

    it('should reject tokens with wrong secret', () => {
      const payload = {
        userId: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        name: 'Test User'
      };

      const wrongSecretToken = jwt.sign(payload, 'wrong-secret', { expiresIn: '1h' });
      
      expect(() => {
        jwt.verify(wrongSecretToken, process.env.JWT_SECRET);
      }).toThrow('invalid signature');
    });
  });
});
