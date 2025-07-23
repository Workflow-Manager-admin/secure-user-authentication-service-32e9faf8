const jwt = require('jsonwebtoken');
const User = require('../models/User');

class AuthService {
  /**
   * Generate JWT token for user
   * @param {Object} user - User object
   * @returns {string} JWT token
   */
  generateToken(user) {
    const payload = {
      userId: user._id,
      email: user.email,
      name: user.name
    };
    
    return jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });
  }

  /**
   * Verify JWT token
   * @param {string} token - JWT token
   * @returns {Object} Decoded token payload
   */
  verifyToken(token) {
    return jwt.verify(token, process.env.JWT_SECRET);
  }

  /**
   * Register new user
   * @param {Object} userData - User registration data
   * @returns {Object} Created user and token
   */
  async register(userData) {
    const { email, password, name } = userData;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new Error('User already exists with this email');
    }

    // Create new user
    const user = new User({
      email,
      password,
      name
    });

    await user.save();

    // Generate token
    const token = this.generateToken(user);

    return {
      user: user.toJSON(),
      token
    };
  }

  /**
   * Login user
   * @param {Object} credentials - User login credentials
   * @returns {Object} User and token
   */
  async login(credentials) {
    const { email, password } = credentials;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new Error('Account is deactivated');
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = this.generateToken(user);

    return {
      user: user.toJSON(),
      token
    };
  }

  /**
   * Get user by ID
   * @param {string} userId - User ID
   * @returns {Object} User object
   */
  async getUserById(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    return user.toJSON();
  }
}

module.exports = new AuthService();
