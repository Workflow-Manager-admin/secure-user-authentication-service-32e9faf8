const { authenticateToken } = require('./auth');
const { registerValidation, loginValidation } = require('./validation');

// This file exports all middleware for easy importing
module.exports = {
  authenticateToken,
  registerValidation,
  loginValidation
};
