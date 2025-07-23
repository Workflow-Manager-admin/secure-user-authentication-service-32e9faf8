# User Authentication Backend - Deployment Guide

## Prerequisites
- Node.js 16+ 
- MongoDB 4.4+
- npm or yarn

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Copy the example environment file and configure:
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
# Server Configuration
PORT=3000
HOST=0.0.0.0
NODE_ENV=production

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/auth-db

# JWT Configuration (Change this secret!)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Password Hashing
BCRYPT_ROUNDS=12
```

### 3. Start MongoDB
Make sure MongoDB is running:
```bash
# On macOS with Homebrew
brew services start mongodb-community

# On Ubuntu/Debian
sudo systemctl start mongod

# Or using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### 4. Start the Application
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

### 5. Verify Installation
- Health check: `curl http://localhost:3000/`
- API docs: Visit `http://localhost:3000/docs`

## Production Deployment

### Environment Variables
Set these environment variables in production:

```bash
export NODE_ENV=production
export PORT=3000
export HOST=0.0.0.0
export MONGODB_URI="mongodb://your-mongo-host:27017/auth-production"
export JWT_SECRET="your-very-secure-jwt-secret-key"
export JWT_EXPIRES_IN="7d"
export BCRYPT_ROUNDS=12
```

### Using PM2 (Recommended)
```bash
# Install PM2 globally
npm install -g pm2

# Start application with PM2
pm2 start src/server.js --name "auth-backend"

# Save PM2 configuration
pm2 save

# Setup auto-restart on boot
pm2 startup
```

### Using Docker
```dockerfile
FROM node:16-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

USER node

CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t auth-backend .
docker run -d -p 3000:3000 --env-file .env auth-backend
```

### Nginx Configuration
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Testing

### Run All Tests
```bash
npm test
```

### Run Simple Tests Only
```bash
npx jest --config jest.simple.config.js
```

### API Testing
```bash
# Test health endpoint
curl http://localhost:3000/

# Test registration
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123456","name":"Test User"}'
```

## Monitoring

### Health Check Endpoint
- URL: `GET /`
- Response: `{"status":"ok","message":"Service is healthy","timestamp":"...","environment":"..."}`

### Logging
The application logs to console. In production, consider:
- Winston for structured logging
- Log aggregation services (ELK stack, Splunk)
- Error tracking (Sentry, Rollbar)

## Security Considerations

### JWT Security
- Use a strong, random JWT secret (256+ bit)
- Set appropriate token expiration times
- Consider token rotation for high-security applications

### Database Security
- Use MongoDB authentication
- Enable SSL/TLS for database connections
- Regular backups and security updates

### Network Security
- Use HTTPS in production
- Configure proper CORS origins
- Implement rate limiting
- Use firewall rules

## Troubleshooting

### Common Issues

**MongoDB Connection Error:**
```
MongoDB connection failed: MongooseServerSelectionError
```
- Ensure MongoDB is running
- Check connection string format
- Verify network connectivity

**JWT Verification Error:**
```
Invalid token
```
- Check JWT_SECRET environment variable
- Verify token format and expiration

**Port Already in Use:**
```
EADDRINUSE: address already in use :::3000
```
- Change PORT environment variable
- Kill existing process: `lsof -ti:3000 | xargs kill`

### Debug Mode
Enable debug logging:
```bash
DEBUG=* npm start
```

## API Reference
See `API.md` for complete API documentation.
