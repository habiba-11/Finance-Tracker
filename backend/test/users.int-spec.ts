import { INestApplication } from '@nestjs/common';
import { createTestApp, stopMongoMemoryServer, getRequestAgent, clearDatabase } from './test-setup';
import * as request from 'supertest';

describe('Users Integration Tests (e2e)', () => {
  let app: INestApplication;
  let httpAgent: request.SuperTest<request.Test>;

  beforeAll(async () => {
    app = await createTestApp();
    httpAgent = getRequestAgent(app);
  });

  afterAll(async () => {
    await app.close();
    await stopMongoMemoryServer();
  });

  // Note: We don't clear database between tests for Users integration tests
  // to allow testing of duplicate email scenarios and login flow

  describe('POST /users/register', () => {
    beforeEach(async () => {
      // Clear database before each test in this block to ensure isolation
      await clearDatabase(app);
    });

    it('should register a new user successfully', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      };

      const response = await httpAgent
        .post('/users/register')
        .send(userData)
        .expect(201); // POST requests return 201 Created

      // Verify response structure
      expect(response.body).toHaveProperty('_id');
      expect(response.body).toHaveProperty('name', userData.name);
      expect(response.body).toHaveProperty('email', userData.email.toLowerCase());
      expect(response.body).not.toHaveProperty('password');
      expect(response.body).not.toHaveProperty('passwordHash');
      
      // Verify _id is a valid MongoDB ObjectId format
      expect(response.body._id).toMatch(/^[0-9a-fA-F]{24}$/);
    });

    it('should fail to register with duplicate email', async () => {
      // First register a user
      const firstUserData = {
        name: 'First User',
        email: 'duplicate@example.com',
        password: 'password123',
      };
      await httpAgent.post('/users/register').send(firstUserData).expect(201);

      // Then try to register with the same email
      const userData = {
        name: 'Test User 2',
        email: 'duplicate@example.com', // Same email as previous registration
        password: 'password123',
      };

      const response = await httpAgent
        .post('/users/register')
        .send(userData)
        .expect(409); // Service throws ConflictException for duplicate email

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('already exists');
    });

    it('should fail to register with invalid email', async () => {
      const userData = {
        name: 'Test User',
        email: 'invalid-email',
        password: 'password123',
      };

      const response = await httpAgent
        .post('/users/register')
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should fail to register with missing fields', async () => {
      const userData = {
        name: 'Test User',
        // Missing email and password
      };

      const response = await httpAgent
        .post('/users/register')
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('POST /users/login', () => {
    let registeredUserId: string;

    beforeEach(async () => {
      // Clear database and register a fresh user for each login test
      await clearDatabase(app);
      
      const userData = {
        name: 'Login Test User',
        email: 'logintest@example.com',
        password: 'password123',
      };

      const response = await httpAgent
        .post('/users/register')
        .send(userData)
        .expect(201);

      registeredUserId = response.body._id;
    });

    it('should login successfully with correct credentials', async () => {
      const loginData = {
        email: 'logintest@example.com',
        password: 'password123',
      };

      const response = await httpAgent
        .post('/users/login')
        .send(loginData)
        .expect(200); // NestJS defaults to 200 unless @HttpCode is specified

      expect(response.body).toHaveProperty('message', 'Login successful');
      expect(response.body).toHaveProperty('userId', registeredUserId);
      
      // Verify userId matches the registered user
      expect(response.body.userId).toBe(registeredUserId);
    });

    it('should fail to login with wrong password', async () => {
      const loginData = {
        email: 'logintest@example.com',
        password: 'wrongpassword',
      };

      const response = await httpAgent
        .post('/users/login')
        .send(loginData)
        .expect(401); // Service throws UnauthorizedException for invalid credentials

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Invalid credentials');
    });

    it('should fail to login with non-existent email', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      const response = await httpAgent
        .post('/users/login')
        .send(loginData)
        .expect(401); // Service throws UnauthorizedException for invalid credentials

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Invalid credentials');
    });

    it('should fail to login with missing fields', async () => {
      const loginData = {
        email: 'logintest@example.com',
        // Missing password
      };

      const response = await httpAgent
        .post('/users/login')
        .send(loginData)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });
  });
});

