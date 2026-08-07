import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { createTestApp } from './support/test-app';

describe('Health & docs (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    ({ app } = await createTestApp());
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /health', () => {
    it('reports database and redis as up, unauthenticated', async () => {
      const response = await request(app.getHttpServer()).get('/health');

      expect(response.status).toBe(200);
      expect(response.body.info.database.status).toBe('up');
      expect(response.body.info.redis.status).toBe('up');
    });
  });

  describe('GET /docs', () => {
    it('serves the Swagger UI', async () => {
      const response = await request(app.getHttpServer()).get('/docs');

      expect(response.status).toBe(200);
    });
  });
});
