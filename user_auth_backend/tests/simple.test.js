// Set environment variables before importing modules
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-12345';
process.env.JWT_EXPIRES_IN = '1h';
process.env.BCRYPT_ROUNDS = '1';

const jwt = require('jsonwebtoken');

describe('Simple Authentication Tests', () => {
  describe('JWT Token Generation and Verification', () => {
    it('should generate and verify JWT tokens correctly', () => {
      const payload = {
        userId: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        name: 'Test User'
      };

      // Generate token
      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
      });

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.email).toBe(payload.email);
      expect(decoded.name).toBe(payload.name);
    });

    it('should reject invalid tokens', () => {
      expect(() => {
        jwt.verify('invalid-token', process.env.JWT_SECRET);
      }).toThrow();
    });
  });

  describe('Password Validation', () => {
    const bcrypt = require('bcryptjs');

    it('should hash and compare passwords correctly', async () => {
      const password = 'Test123456';
      const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 1;
      
      // Hash password
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).not.toBe(password);

      // Compare password
      const isValid = await bcrypt.compare(password, hashedPassword);
      expect(isValid).toBe(true);

      // Compare wrong password
      const isInvalid = await bcrypt.compare('wrongpassword', hashedPassword);
      expect(isInvalid).toBe(false);
    });
  });
});
