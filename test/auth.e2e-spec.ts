import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import {
  completeLogin,
  drainRegistrationVerificationEmail,
  registerUser,
} from './support/api.helpers';
import { NotificationSenderSpy } from './support/notification-sender.spy';
import { createTestApp } from './support/test-app';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let notifications: NotificationSenderSpy;

  beforeAll(async () => {
    ({ app, notifications } = await createTestApp());
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /auth/login', () => {
    it('maps InvalidCredentialsError to 401, not 500', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'nobody@example.com', password: 'wrong-password' });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('InvalidCredentialsError');
    });

    it('confirms credentials without issuing a session yet', async () => {
      const user = await registerUser(app);

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: user.email, password: user.password });

      expect(response.status).toBe(200);
      expect(response.body.user.email).toBe(user.email);
      expect(response.body.accessToken).toBeUndefined();
    });
  });

  describe('Full login -> verify -> complete flow', () => {
    it('issues a real access/refresh token pair once the code is validated', async () => {
      const user = await registerUser(app);
      await drainRegistrationVerificationEmail(notifications, user.email);

      const session = await completeLogin(
        app,
        notifications,
        user.email,
        user.password,
      );

      expect(session.accessToken).toEqual(expect.any(String));
      expect(session.refreshToken).toEqual(expect.any(String));
    });
  });

  describe('POST /auth/refresh-token', () => {
    it('rotates a refresh token for a new token pair', async () => {
      const user = await registerUser(app);
      await drainRegistrationVerificationEmail(notifications, user.email);
      const session = await completeLogin(
        app,
        notifications,
        user.email,
        user.password,
      );

      const response = await request(app.getHttpServer())
        .post('/auth/refresh-token')
        .send({ refreshToken: session.refreshToken });

      expect(response.status).toBe(200);
      expect(response.body.accessToken).toEqual(expect.any(String));
      expect(response.body.refreshToken).toEqual(expect.any(String));
    });

    it('rejects an invalid refresh token with 401', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/refresh-token')
        .send({ refreshToken: 'not-a-real-token' });

      expect(response.status).toBe(401);
    });
  });

  describe('POST /auth/logout', () => {
    it('revokes a refresh token, which can no longer be used to refresh', async () => {
      const user = await registerUser(app);
      await drainRegistrationVerificationEmail(notifications, user.email);
      const session = await completeLogin(
        app,
        notifications,
        user.email,
        user.password,
      );

      await request(app.getHttpServer())
        .post('/auth/logout')
        .send({ refreshToken: session.refreshToken })
        .expect(204);

      const refreshAfterLogout = await request(app.getHttpServer())
        .post('/auth/refresh-token')
        .send({ refreshToken: session.refreshToken });

      expect(refreshAfterLogout.status).toBe(401);
    });
  });

  describe('Protected routes', () => {
    it('rejects an unauthenticated request with 401', async () => {
      const response = await request(app.getHttpServer()).get(
        '/qualifications',
      );

      expect(response.status).toBe(401);
    });
  });
});
