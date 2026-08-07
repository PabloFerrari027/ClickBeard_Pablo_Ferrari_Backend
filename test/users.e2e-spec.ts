import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { UserRole } from '../src/modules/identity/core/domain/enums/user-role.enum';
import {
  authHeader,
  getAdminSession,
  registerAndLogin,
  registerUser,
  uniqueEmail,
} from './support/api.helpers';
import { NotificationSenderSpy } from './support/notification-sender.spy';
import { createTestApp } from './support/test-app';

describe('Users (e2e)', () => {
  let app: INestApplication;
  let notifications: NotificationSenderSpy;

  beforeAll(async () => {
    ({ app, notifications } = await createTestApp());
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /users', () => {
    it('registers a new CLIENT user', async () => {
      const email = uniqueEmail('e2e-register');
      const response = await request(app.getHttpServer())
        .post('/users')
        .send({ name: 'E2E Test User', email, password: 'Password123' });

      expect(response.status).toBe(201);
      expect(response.body.email).toBe(email);
      expect(response.body.role).toBe('CLIENT');
      expect(response.body.passwordHash).toBeUndefined();
    });

    it('rejects an invalid payload with 400', async () => {
      const response = await request(app.getHttpServer())
        .post('/users')
        .send({ name: 'A', email: 'not-an-email', password: '123' });

      expect(response.status).toBe(400);
    });

    it('maps UserAlreadyExistsError (ConflictError) to 409, not 500', async () => {
      const email = uniqueEmail('e2e-duplicate');
      await request(app.getHttpServer())
        .post('/users')
        .send({ name: 'First', email, password: 'Password123' })
        .expect(201);

      const response = await request(app.getHttpServer())
        .post('/users')
        .send({ name: 'Second', email, password: 'Password123' });

      expect(response.status).toBe(409);
      expect(response.body.error).toBe('UserAlreadyExistsError');
    });

    it('rejects registering an ADMIN without an admin requesterId with 404', async () => {
      const response = await request(app.getHttpServer())
        .post('/users')
        .send({
          name: 'Rogue Admin',
          email: uniqueEmail('e2e-rogue-admin'),
          password: 'Password123',
          role: 'ADMIN',
        });

      expect(response.status).toBe(404);
    });
  });

  describe('POST /users/authenticate', () => {
    it('authenticates with valid credentials', async () => {
      const user = await registerUser(app);

      const response = await request(app.getHttpServer())
        .post('/users/authenticate')
        .send({ email: user.email, password: user.password });

      expect(response.status).toBe(200);
      expect(response.body.email).toBe(user.email);
    });

    it('maps InvalidCredentialsError to 401 for a wrong password', async () => {
      const user = await registerUser(app);

      const response = await request(app.getHttpServer())
        .post('/users/authenticate')
        .send({ email: user.email, password: 'WrongPassword123' });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /users/:id', () => {
    it('rejects an unauthenticated request with 401', async () => {
      const user = await registerUser(app);

      const response = await request(app.getHttpServer()).get(
        `/users/${user.id}`,
      );

      expect(response.status).toBe(401);
    });

    it('allows the owner to fetch their own profile', async () => {
      const { user, session } = await registerAndLogin(app, notifications);

      const response = await request(app.getHttpServer())
        .get(`/users/${user.id}`)
        .set(authHeader(session.accessToken));

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(user.id);
    });

    it('rejects one authenticated CLIENT reading another with 403', async () => {
      const { session } = await registerAndLogin(app, notifications);
      const otherUser = await registerUser(app);

      const response = await request(app.getHttpServer())
        .get(`/users/${otherUser.id}`)
        .set(authHeader(session.accessToken));

      expect(response.status).toBe(403);
    });
  });

  describe('PATCH /users/:id/password', () => {
    it('allows the owner to change their own password', async () => {
      const { user, session } = await registerAndLogin(app, notifications);

      const response = await request(app.getHttpServer())
        .patch(`/users/${user.id}/password`)
        .set(authHeader(session.accessToken))
        .send({
          currentPassword: user.password,
          newPassword: 'NewPassword123',
        });

      expect(response.status).toBe(204);
    });
  });

  describe('Admin-only user management', () => {
    let adminSession: Awaited<ReturnType<typeof registerAndLogin>>['session'];

    beforeAll(async () => {
      ({ session: adminSession } = await registerAndLogin(app, notifications, {
        role: UserRole.CLIENT,
      }));
    });

    it('rejects role changes from a non-admin with 403', async () => {
      const target = await registerUser(app);

      const response = await request(app.getHttpServer())
        .patch(`/users/${target.id}/role`)
        .set(authHeader(adminSession.accessToken))
        .send({ role: 'BARBER' });

      expect(response.status).toBe(403);
    });
  });

  describe('ADMIN lifecycle', () => {
    it('lets an admin change role, deactivate and reactivate a user', async () => {
      const admin = await getAdminSession(app, notifications);
      const target = await registerUser(app);

      const roleResponse = await request(app.getHttpServer())
        .patch(`/users/${target.id}/role`)
        .set(authHeader(admin.accessToken))
        .send({ role: 'BARBER' });
      expect(roleResponse.status).toBe(200);
      expect(roleResponse.body.role).toBe('BARBER');

      const deactivateResponse = await request(app.getHttpServer())
        .patch(`/users/${target.id}/deactivate`)
        .set(authHeader(admin.accessToken));
      expect(deactivateResponse.status).toBe(200);
      expect(deactivateResponse.body.active).toBe(false);

      const activateResponse = await request(app.getHttpServer())
        .patch(`/users/${target.id}/activate`)
        .set(authHeader(admin.accessToken));
      expect(activateResponse.status).toBe(200);
      expect(activateResponse.body.active).toBe(true);
    });
  });
});
