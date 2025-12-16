import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import request from 'supertest';
import { AppModule } from '../src/app.module';

let mongod: MongoMemoryServer | null = null;

/**
 * Setup in-memory MongoDB instance
 * Creates a new MongoDB instance in memory for testing
 * 
 * @returns {Promise<string>} MongoDB connection URI
 */
export async function setupMongoMemoryServer(): Promise<string> {
  if (!mongod) {
    mongod = await MongoMemoryServer.create({
      instance: {
        dbName: 'test-db',
      },
      // Let mongodb-memory-server use its default version (usually cached)
      // This avoids long download times on first run
    });
  }
  return mongod.getUri();
}

/**
 * Stop in-memory MongoDB instance
 * Cleanly shuts down the MongoDB instance and frees resources
 */
export async function stopMongoMemoryServer(): Promise<void> {
  if (mongod) {
    await mongod.stop();
    mongod = null;
  }
}

/**
 * Create a NestJS application for integration testing
 * 
 * This function:
 * 1. Sets up an in-memory MongoDB instance using mongodb-memory-server
 * 2. Configures the NestJS app to use this in-memory database
 * 3. Applies the same global pipes and filters as production
 * 4. Ensures proper cleanup of environment variables
 * 
 * @returns {Promise<INestApplication>} Configured NestJS application ready for testing
 */
export async function createTestApp(): Promise<INestApplication> {
  // Setup in-memory MongoDB and get URI
  const mongoUri = await setupMongoMemoryServer();
  
  if (process.env.NODE_ENV !== 'test') {
    console.log(`[Test Setup] MongoDB Memory Server started at: ${mongoUri}`);
  }

  // Store original MONGODB_URI if it exists
  const originalMongoUri = process.env.MONGODB_URI;

  // Override MONGODB_URI before creating the test module
  // This ensures AppModule uses the in-memory MongoDB when MongooseModule.forRoot() is called
  process.env.MONGODB_URI = mongoUri;

  try {
    // Create test module using AppModule
    // AppModule will read process.env.MONGODB_URI which we just set
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const app = moduleFixture.createNestApplication();

    // Apply global pipes for validation (matching production setup from main.ts)
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true, // Strip properties that don't have decorators
        forbidNonWhitelisted: true, // Throw error if non-whitelisted properties are present
        transform: true, // Automatically transform payloads to DTO instances
        transformOptions: {
          enableImplicitConversion: true, // Allow implicit type conversion
        },
      }),
    );

    // Enable CORS like in main.ts
    app.enableCors();

    // Initialize the application (this connects to MongoDB)
    await app.init();

    // Verify MongoDB connection is established
    // Wait a bit for connection to be ready
    const connection = app.get<Connection>(getConnectionToken());
    
    // Poll until connection is ready (max 5 seconds)
    let attempts = 0;
    while (connection.readyState !== 1 && attempts < 50) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
    
    if (connection.readyState !== 1) {
      throw new Error(`MongoDB connection not established. ReadyState: ${connection.readyState}`);
    }
    
    if (process.env.NODE_ENV !== 'test') {
      console.log('[Test Setup] NestJS app initialized and connected to in-memory MongoDB');
    }

    return app;
  } catch (error) {
    console.error('[Test Setup] Error creating test app:', error);
    throw error;
  } finally {
    // Restore original MONGODB_URI if it existed
    // This prevents test environment from affecting other processes
    if (originalMongoUri) {
      process.env.MONGODB_URI = originalMongoUri;
    } else {
      delete process.env.MONGODB_URI;
    }
  }
}

/**
 * Clean up database collections between tests
 * This ensures tests are isolated and don't affect each other
 * 
 * @param {INestApplication} app - The NestJS application instance
 */
export async function clearDatabase(app: INestApplication): Promise<void> {
  const connection = app.get<Connection>(getConnectionToken());
  const collections = connection.collections;
  
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
}

/**
 * Get Supertest request agent for testing HTTP endpoints
 * 
 * @param {INestApplication} app - The NestJS application instance
 * @returns {request.SuperTest<request.Test>} Supertest agent for making HTTP requests
 */
export function getRequestAgent(app: INestApplication): request.SuperTest<request.Test> {
  return request(app.getHttpServer());
}

