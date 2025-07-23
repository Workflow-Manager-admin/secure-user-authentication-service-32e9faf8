const authService = require('../src/services/authService');
const User = require('../src/models/User');

// Mock the User model for unit testing
jest.mock('../src/models/User');

describe('Auth Service Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        name: 'Test User'
      };

      const token = authService.generateToken(mockUser);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid token', () => {
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        name: 'Test User'
      };

      const token = authService.generateToken(mockUser);
      const decoded = authService.verifyToken(token);

      expect(decoded.userId).toBe(mockUser._id);
      expect(decoded.email).toBe(mockUser.email);
      expect(decoded.name).toBe(mockUser.name);
    });

    it('should throw error for invalid token', () => {
      expect(() => {
        authService.verifyToken('invalid-token');
      }).toThrow();
    });
  });

  describe('register', () => {
    it('should register a new user', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Test123456',
        name: 'Test User'
      };

      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        ...userData,
        save: jest.fn().mockResolvedValue(true),
        toJSON: jest.fn().mockReturnValue({
          _id: '507f1f77bcf86cd799439011',
          email: userData.email,
          name: userData.name,
          isActive: true
        })
      };

      User.findOne.mockResolvedValue(null); // User doesn't exist
      User.mockImplementation(() => mockUser);

      const result = await authService.register(userData);

      expect(User.findOne).toHaveBeenCalledWith({ email: userData.email });
      expect(mockUser.save).toHaveBeenCalled();
      expect(result.user).toBeDefined();
      expect(result.token).toBeDefined();
      expect(result.user.email).toBe(userData.email);
    });

    it('should throw error if user already exists', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Test123456',
        name: 'Test User'
      };

      User.findOne.mockResolvedValue({ email: userData.email }); // User exists

      await expect(authService.register(userData)).rejects.toThrow('User already exists with this email');
    });
  });
});

describe('Health Service', () => {
  const healthService = require('../src/services/health');

  it('should return health status', () => {
    const status = healthService.getStatus();
    
    expect(status.status).toBe('ok');
    expect(status.message).toBe('Service is healthy');
    expect(status.timestamp).toBeDefined();
    expect(status.environment).toBeDefined();
  });
});
