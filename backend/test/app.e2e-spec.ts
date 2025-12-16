import { INestApplication } from '@nestjs/common';
import { createTestApp, stopMongoMemoryServer, getRequestAgent } from './test-setup';
import * as request from 'supertest';

describe('AppController (e2e)', () => {
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

  it('/ (GET)', () => {
    return httpAgent
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });
});
