const { validationResult } = require('express-validator');
const authService = require('../services/authService');

class AuthController {
  /**
   * PUBLIC_INTERFACE
   * User registration endpoint
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  async register(req, res) {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          status: 'error',
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { email, password, name } = req.body;
      const result = await authService.register({ email, password, name });

      res.status(201).json({
        status: 'success',
        message: 'User registered successfully',
        data: result
      });
    } catch (error) {
      console.error('Registration error:', error);
      
      if (error.message === 'User already exists with this email') {
        return res.status(409).json({
          status: 'error',
          message: error.message
        });
      }

      res.status(500).json({
        status: 'error',
        message: 'Registration failed',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * PUBLIC_INTERFACE
   * User login endpoint
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  async login(req, res) {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          status: 'error',
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { email, password } = req.body;
      const result = await authService.login({ email, password });

      res.status(200).json({
        status: 'success',
        message: 'Login successful',
        data: result
      });
    } catch (error) {
      console.error('Login error:', error);
      
      if (error.message === 'Invalid email or password' || error.message === 'Account is deactivated') {
        return res.status(401).json({
          status: 'error',
          message: error.message
        });
      }

      res.status(500).json({
        status: 'error',
        message: 'Login failed',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * PUBLIC_INTERFACE
   * Get current user profile
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  async getProfile(req, res) {
    try {
      const userId = req.user.userId;
      const user = await authService.getUserById(userId);

      res.status(200).json({
        status: 'success',
        message: 'Profile retrieved successfully',
        data: { user }
      });
    } catch (error) {
      console.error('Get profile error:', error);
      
      if (error.message === 'User not found') {
        return res.status(404).json({
          status: 'error',
          message: error.message
        });
      }

      res.status(500).json({
        status: 'error',
        message: 'Failed to retrieve profile',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * PUBLIC_INTERFACE
   * Logout endpoint (client-side token removal)
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  async logout(req, res) {
    res.status(200).json({
      status: 'success',
      message: 'Logout successful. Please remove token from client side.'
    });
  }
}

module.exports = new AuthController();
