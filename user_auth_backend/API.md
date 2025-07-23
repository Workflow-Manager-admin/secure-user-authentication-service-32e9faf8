# User Authentication API Documentation

## Overview
This is a secure user authentication backend service built with Express.js, MongoDB, and JWT tokens. It provides endpoints for user registration, login, profile management, and logout.

## Base URL
- Development: `http://localhost:3000`
- API Documentation: `http://localhost:3000/docs` (Swagger UI)

## Environment Variables
Create a `.env` file with the following variables:

```env
# Server Configuration
PORT=3000
HOST=0.0.0.0
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/auth-db

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Password Hashing
BCRYPT_ROUNDS=12
```

## API Endpoints

### Health Check
- **GET** `/`
- **Description**: Health check endpoint
- **Response**: 200 OK
```json
{
  "status": "ok",
  "message": "Service is healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "development"
}
```

### User Registration
- **POST** `/auth/register`
- **Description**: Register a new user account
- **Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "name": "John Doe"
}
```
- **Validation Rules**:
  - Email: Valid email format
  - Password: Min 6 characters, must contain uppercase, lowercase, and number
  - Name: 2-50 characters, letters and spaces only
- **Response**: 201 Created
```json
{
  "status": "success",
  "message": "User registered successfully",
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "email": "user@example.com",
      "name": "John Doe",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### User Login
- **POST** `/auth/login`
- **Description**: Authenticate user with email and password
- **Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```
- **Response**: 200 OK
```json
{
  "status": "success",
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "email": "user@example.com",
      "name": "John Doe",
      "isActive": true,
      "lastLogin": "2024-01-01T00:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Get User Profile
- **GET** `/auth/profile`
- **Description**: Get current user's profile information
- **Authentication**: Bearer Token required
- **Headers**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
- **Response**: 200 OK
```json
{
  "status": "success",
  "message": "Profile retrieved successfully",
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "email": "user@example.com",
      "name": "John Doe",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

### User Logout
- **POST** `/auth/logout`
- **Description**: Logout user (client should remove token)
- **Authentication**: Bearer Token required
- **Response**: 200 OK
```json
{
  "status": "success",
  "message": "Logout successful. Please remove token from client side."
}
```

## Error Responses

### Validation Error (400)
```json
{
  "status": "error",
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Please provide a valid email address"
    }
  ]
}
```

### Unauthorized (401)
```json
{
  "status": "error",
  "message": "Invalid email or password"
}
```

### User Already Exists (409)
```json
{
  "status": "error",
  "message": "User already exists with this email"
}
```

### Server Error (500)
```json
{
  "status": "error",
  "message": "Internal Server Error"
}
```

## Security Features
- Password hashing with bcrypt (configurable rounds)
- JWT token authentication
- Input validation and sanitization
- CORS configuration
- Error handling middleware
- Rate limiting ready (can be added)

## Usage Examples

### cURL Examples

**Register a new user:**
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123",
    "name": "John Doe"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123"
  }'
```

**Get profile:**
```bash
curl -X GET http://localhost:3000/auth/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Development

### Running the Server
```bash
# Install dependencies
npm install

# Development mode with auto-reload
npm run dev

# Production mode
npm start

# Run tests
npm test

# Lint code
npm run lint
```

### Project Structure
```
src/
├── app.js              # Express app configuration
├── server.js           # Server startup
├── controllers/        # Route controllers
├── middleware/         # Custom middleware
├── models/            # Database models
├── routes/            # API routes
└── services/          # Business logic services
```
