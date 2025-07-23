const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');

describe('Authentication Endpoints', () => {
  const validUser = {
    email: 'test@example.com',
    password: 'Test123456',
    name: 'Test User'
  };

  describe('POST /auth/register', () => {
    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send(validUser)
        .expect(201);

      expect(response.body.status).toBe('success');
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

    it('should not register duplicate user', async () => {
      // Register first user
      await request(app)
        .post('/auth/register')
        .send(validUser)
        .expect(201);

      // Try to register same user again
      const response = await request(app)
        .post('/auth/register')
        .send(validUser)
        .expect(409);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('User already exists with this email');
    });
  });

  describe('POST /auth/login', () => {
    beforeEach(async () => {
      // Register a user for login tests
      await request(app)
        .post('/auth/register')
        .send(validUser);
    });

    it('should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: validUser.email,
          password: validUser.password
        })
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.user.email).toBe(validUser.email);
      expect(response.body.data.token).toBeDefined();
    });

    it('should not login with invalid email', async () => {
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
      // Deactivate user
      await User.findOneAndUpdate(
        { email: validUser.email },
        { isActive: false }
      );

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
  });

  describe('GET /auth/profile', () => {
    let authToken;

    beforeEach(async () => {
      // Register and login to get token
      const registerResponse = await request(app)
        .post('/auth/register')
        .send(validUser);
      
      authToken = registerResponse.body.data.token;
    });

    it('should get profile with valid token', async () => {
      const response = await request(app)
        .get('/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.user.email).toBe(validUser.email);
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
  });

  describe('POST /auth/logout', () => {
    let authToken;

    beforeEach(async () => {
      // Register and login to get token
      const registerResponse = await request(app)
        .post('/auth/register')
        .send(validUser);
      
      authToken = registerResponse.body.data.token;
    });

    it('should logout successfully', async () => {
      const response = await request(app)
        .post('/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.message).toBe('Logout successful. Please remove token from client side.');
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
      expect(response.body.environment).toBeDefined();
    });
  });
});
