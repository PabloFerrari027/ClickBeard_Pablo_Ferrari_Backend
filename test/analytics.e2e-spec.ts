import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import {
  authHeader,
  getAdminSession,
  registerAndLogin,
  Session,
} from './support/api.helpers';
import { NotificationSenderSpy } from './support/notification-sender.spy';
import { createTestApp } from './support/test-app';

const ROUTES = [
  'dashboard',
  'users',
  'appointments',
  'barbers',
  'customers',
  'occupation',
];

describe('Analytics (e2e)', () => {
  let app: INestApplication;
  let notifications: NotificationSenderSpy;
  let admin: Session;

  beforeAll(async () => {
    ({ app, notifications } = await createTestApp());
    admin = await getAdminSession(app, notifications);
  });

  afterAll(async () => {
    await app.close();
  });

  describe.each(ROUTES)('GET /analytics/%s', (route) => {
    it('rejects an unauthenticated request with 401', async () => {
      const response = await request(app.getHttpServer())
        .get(`/analytics/${route}`)
        .query({ preset: 'MONTH' });

      expect(response.status).toBe(401);
    });

    it('rejects a non-admin with 403', async () => {
      const { session } = await registerAndLogin(app, notifications);

      const response = await request(app.getHttpServer())
        .get(`/analytics/${route}`)
        .set(authHeader(session.accessToken))
        .query({ preset: 'MONTH' });

      expect(response.status).toBe(403);
    });

    it('returns 200 for an admin', async () => {
      const response = await request(app.getHttpServer())
        .get(`/analytics/${route}`)
        .set(authHeader(admin.accessToken))
        .query({ preset: 'MONTH' });

      expect(response.status).toBe(200);
    });

    it('rejects an invalid preset with 400', async () => {
      const response = await request(app.getHttpServer())
        .get(`/analytics/${route}`)
        .set(authHeader(admin.accessToken))
        .query({ preset: 'NOT_A_PRESET' });

      expect(response.status).toBe(400);
    });
  });
});
