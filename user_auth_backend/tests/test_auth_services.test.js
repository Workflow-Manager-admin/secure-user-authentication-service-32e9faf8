// Set environment variables before importing modules
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-12345';
process.env.JWT_EXPIRES_IN = '1h';
process.env.BCRYPT_ROUNDS = '1';

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Mock User model before importing authService
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
  
  return mockUser;
});

const authService = require('../src/services/authService');
const User = require('../src/models/User');

describe('Auth Service Unit Tests', () => {
  const mockUser = {
    _id: '507f1f77bcf86cd799439011',
    email: 'test@example.com',
    name: 'Test User',
    isActive: true
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const token = authService.generateToken(mockUser);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts

      // Verify token structure
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      expect(decoded.userId).toBe(mockUser._id);
      expect(decoded.email).toBe(mockUser.email);
      expect(decoded.name).toBe(mockUser.name);
    });

    it('should include correct payload in token', () => {
      const token = authService.generateToken(mockUser);
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      expect(decoded.userId).toBe(mockUser._id);
      expect(decoded.email).toBe(mockUser.email);
      expect(decoded.name).toBe(mockUser.name);
      expect(decoded.exp).toBeDefined(); // Expiration time
      expect(decoded.iat).toBeDefined(); // Issued at time
    });

    it('should use correct expiration time', () => {
      const token = authService.generateToken(mockUser);
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      const expectedExpiration = Math.floor(Date.now() / 1000) + (60 * 60); // 1 hour from now
      expect(decoded.exp).toBeCloseTo(expectedExpiration, -2); // Allow 100 second tolerance
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid token', () => {
      const token = authService.generateToken(mockUser);
      const decoded = authService.verifyToken(token);

      expect(decoded.userId).toBe(mockUser._id);
      expect(decoded.email).toBe(mockUser.email);
      expect(decoded.name).toBe(mockUser.name);
    });

    it('should throw JsonWebTokenError for invalid token', () => {
      expect(() => {
        authService.verifyToken('invalid-token');
      }).toThrow('jwt malformed');
    });

    it('should throw TokenExpiredError for expired token', () => {
      const expiredToken = jwt.sign(
        { userId: mockUser._id, email: mockUser.email, name: mockUser.name },
        process.env.JWT_SECRET,
        { expiresIn: '-1h' }
      );

      expect(() => {
        authService.verifyToken(expiredToken);
      }).toThrow('jwt expired');
    });

    it('should throw error for token with wrong secret', () => {
      const wrongToken = jwt.sign(
        { userId: mockUser._id, email: mockUser.email, name: mockUser.name },
        'wrong-secret',
        { expiresIn: '1h' }
      );

      expect(() => {
        authService.verifyToken(wrongToken);
      }).toThrow('invalid signature');
    });
  });

  describe('register', () => {
    const userData = {
      email: 'test@example.com',
      password: 'Test123456',
      name: 'Test User'
    };

    it('should register a new user successfully', async () => {
      const mockNewUser = {
        _id: mockUser._id,
        email: userData.email,
        name: userData.name,
        save: jest.fn().mockResolvedValue(true),
        toJSON: jest.fn().mockReturnValue({
          _id: mockUser._id,
          email: userData.email,
          name: userData.name,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        })
      };

      User.findOne.mockResolvedValue(null); // User doesn't exist
      User.mockImplementationOnce(() => mockNewUser);

      const result = await authService.register(userData);

      expect(User.findOne).toHaveBeenCalledWith({ email: userData.email });
      expect(mockNewUser.save).toHaveBeenCalled();
      expect(result.user).toBeDefined();
      expect(result.token).toBeDefined();
      expect(result.user.email).toBe(userData.email);
      expect(result.user.name).toBe(userData.name);
      expect(result.user.password).toBeUndefined();
    });

    it('should throw error if user already exists', async () => {
      User.findOne.mockResolvedValue({ email: userData.email }); // User exists

      await expect(authService.register(userData)).rejects.toThrow('User already exists with this email');
      expect(User.findOne).toHaveBeenCalledWith({ email: userData.email });
    });

    it('should handle database save errors', async () => {
      const mockNewUser = {
        save: jest.fn().mockRejectedValue(new Error('Database save failed'))
      };

      User.findOne.mockResolvedValue(null);
      User.mockImplementationOnce(() => mockNewUser);

      await expect(authService.register(userData)).rejects.toThrow('Database save failed');
    });
  });

  describe('login', () => {
    const credentials = {
      email: 'test@example.com',
      password: 'Test123456'
    };

    it('should login successfully with valid credentials', async () => {
      const mockLoginUser = {
        ...mockUser,
        lastLogin: null,
        comparePassword: jest.fn().mockResolvedValue(true),
        save: jest.fn().mockResolvedValue(true),
        toJSON: jest.fn().mockReturnValue(mockUser)
      };

      User.findOne.mockResolvedValue(mockLoginUser);

      const result = await authService.login(credentials);

      expect(User.findOne).toHaveBeenCalledWith({ email: credentials.email });
      expect(mockLoginUser.comparePassword).toHaveBeenCalledWith(credentials.password);
      expect(mockLoginUser.save).toHaveBeenCalled();
      expect(result.user).toBeDefined();
      expect(result.token).toBeDefined();
      expect(result.user.email).toBe(credentials.email);
    });

    it('should throw error for non-existent user', async () => {
      User.findOne.mockResolvedValue(null);

      await expect(authService.login(credentials)).rejects.toThrow('Invalid email or password');
      expect(User.findOne).toHaveBeenCalledWith({ email: credentials.email });
    });

    it('should throw error for deactivated account', async () => {
      const mockDeactivatedUser = {
        ...mockUser,
        isActive: false
      };

      User.findOne.mockResolvedValue(mockDeactivatedUser);

      await expect(authService.login(credentials)).rejects.toThrow('Account is deactivated');
    });

    it('should throw error for invalid password', async () => {
      const mockLoginUser = {
        ...mockUser,
        comparePassword: jest.fn().mockResolvedValue(false)
      };

      User.findOne.mockResolvedValue(mockLoginUser);

      await expect(authService.login(credentials)).rejects.toThrow('Invalid email or password');
      expect(mockLoginUser.comparePassword).toHaveBeenCalledWith(credentials.password);
    });

    it('should update lastLogin timestamp', async () => {
      const mockLoginUser = {
        ...mockUser,
        lastLogin: null,
        comparePassword: jest.fn().mockResolvedValue(true),
        save: jest.fn().mockResolvedValue(true),
        toJSON: jest.fn().mockReturnValue(mockUser)
      };

      User.findOne.mockResolvedValue(mockLoginUser);

      await authService.login(credentials);

      expect(mockLoginUser.lastLogin).toBeInstanceOf(Date);
      expect(mockLoginUser.save).toHaveBeenCalled();
    });
  });

  describe('getUserById', () => {
    it('should return user for valid ID', async () => {
      const mockFoundUser = {
        toJSON: jest.fn().mockReturnValue(mockUser)
      };

      User.findById.mockResolvedValue(mockFoundUser);

      const result = await authService.getUserById(mockUser._id);

      expect(User.findById).toHaveBeenCalledWith(mockUser._id);
      expect(mockFoundUser.toJSON).toHaveBeenCalled();
      expect(result).toEqual(mockUser);
    });

    it('should throw error for non-existent user', async () => {
      User.findById.mockResolvedValue(null);

      await expect(authService.getUserById('nonexistent-id')).rejects.toThrow('User not found');
      expect(User.findById).toHaveBeenCalledWith('nonexistent-id');
    });
  });
});

describe('Password Hashing and Validation Tests', () => {
  describe('bcrypt functionality', () => {
    it('should hash passwords correctly', async () => {
      const password = 'Test123456';
      const saltRounds = 1; // Use low rounds for testing
      
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      
      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).not.toBe(password);
      expect(hashedPassword.length).toBeGreaterThan(10);
    });

    it('should compare passwords correctly', async () => {
      const password = 'Test123456';
      const saltRounds = 1;
      
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      
      // Correct password should match
      const isValidCorrect = await bcrypt.compare(password, hashedPassword);
      expect(isValidCorrect).toBe(true);
      
      // Wrong password should not match
      const isValidWrong = await bcrypt.compare('WrongPassword123', hashedPassword);
      expect(isValidWrong).toBe(false);
    });

    it('should generate different hashes for same password', async () => {
      const password = 'Test123456';
      const saltRounds = 1;
      
      const hash1 = await bcrypt.hash(password, saltRounds);
      const hash2 = await bcrypt.hash(password, saltRounds);
      
      expect(hash1).not.toBe(hash2);
      
      // Both should still validate correctly
      expect(await bcrypt.compare(password, hash1)).toBe(true);
      expect(await bcrypt.compare(password, hash2)).toBe(true);
    });
  });
});

describe('JWT Token Security Tests', () => {
  describe('token security', () => {
    it('should not accept tokens with different secrets', () => {
      const payload = { userId: '123', email: 'test@example.com' };
      const correctToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
      const wrongSecretToken = jwt.sign(payload, 'wrong-secret', { expiresIn: '1h' });
      
      // Correct token should verify
      expect(() => jwt.verify(correctToken, process.env.JWT_SECRET)).not.toThrow();
      
      // Wrong secret token should fail
      expect(() => jwt.verify(wrongSecretToken, process.env.JWT_SECRET)).toThrow();
    });

    it('should handle malformed tokens', () => {
      const malformedTokens = [
        'not.a.token',
        'definitely-not-a-jwt',
        '',
        'header.payload', // Missing signature
        'too.many.parts.in.this.token'
      ];

      malformedTokens.forEach(token => {
        expect(() => jwt.verify(token, process.env.JWT_SECRET)).toThrow();
      });
    });

    it('should validate token expiration', () => {
      // Create an already expired token
      const expiredToken = jwt.sign(
        { userId: '123', email: 'test@example.com' },
        process.env.JWT_SECRET,
        { expiresIn: '-1s' } // Expired 1 second ago
      );

      expect(() => jwt.verify(expiredToken, process.env.JWT_SECRET)).toThrow('jwt expired');
    });
  });
});
