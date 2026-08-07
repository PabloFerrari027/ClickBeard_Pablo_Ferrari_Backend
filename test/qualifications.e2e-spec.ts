import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import {
  authHeader,
  getAdminSession,
  registerAndLogin,
  Session,
  uniqueEmail,
} from './support/api.helpers';
import { NotificationSenderSpy } from './support/notification-sender.spy';
import { createTestApp } from './support/test-app';

describe('Qualifications (e2e)', () => {
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

  describe('POST /qualifications', () => {
    it('rejects an unauthenticated request with 401', async () => {
      const response = await request(app.getHttpServer())
        .post('/qualifications')
        .send({ name: 'Beard Trim' });

      expect(response.status).toBe(401);
    });

    it('rejects a non-admin with 403', async () => {
      const { session } = await registerAndLogin(app, notifications);

      const response = await request(app.getHttpServer())
        .post('/qualifications')
        .set(authHeader(session.accessToken))
        .send({ name: `Beard Trim ${uniqueEmail('q')}` });

      expect(response.status).toBe(403);
    });

    it('creates a qualification as admin', async () => {
      const response = await request(app.getHttpServer())
        .post('/qualifications')
        .set(authHeader(admin.accessToken))
        .send({
          name: `Beard Trim ${uniqueEmail('q')}`,
          description: 'Trims and shapes beards',
        });

      expect(response.status).toBe(201);
      expect(response.body.id).toEqual(expect.any(String));
      expect(response.body.description).toBe('Trims and shapes beards');
    });
  });

  describe('GET /qualifications', () => {
    it('rejects an unauthenticated request with 401', async () => {
      const response = await request(app.getHttpServer()).get(
        '/qualifications',
      );

      expect(response.status).toBe(401);
    });

    it('lists qualifications for any authenticated user', async () => {
      const created = await request(app.getHttpServer())
        .post('/qualifications')
        .set(authHeader(admin.accessToken))
        .send({ name: `Listable Qualification ${uniqueEmail('q')}` });

      const { session } = await registerAndLogin(app, notifications);

      const response = await request(app.getHttpServer())
        .get('/qualifications')
        .set(authHeader(session.accessToken));

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: created.body.id }),
        ]),
      );
    });
  });

  describe('PATCH /qualifications/:id', () => {
    it('updates a qualification as admin', async () => {
      const created = await request(app.getHttpServer())
        .post('/qualifications')
        .set(authHeader(admin.accessToken))
        .send({ name: `Updatable Qualification ${uniqueEmail('q')}` });

      const response = await request(app.getHttpServer())
        .patch(`/qualifications/${created.body.id}`)
        .set(authHeader(admin.accessToken))
        .send({ description: 'Updated description' });

      expect(response.status).toBe(200);
      expect(response.body.description).toBe('Updated description');
    });

    it('rejects a non-admin with 403', async () => {
      const created = await request(app.getHttpServer())
        .post('/qualifications')
        .set(authHeader(admin.accessToken))
        .send({ name: `Protected Qualification ${uniqueEmail('q')}` });
      const { session } = await registerAndLogin(app, notifications);

      const response = await request(app.getHttpServer())
        .patch(`/qualifications/${created.body.id}`)
        .set(authHeader(session.accessToken))
        .send({ description: 'Should not apply' });

      expect(response.status).toBe(403);
    });
  });

  describe('DELETE /qualifications/:id', () => {
    it('deletes a qualification as admin', async () => {
      const created = await request(app.getHttpServer())
        .post('/qualifications')
        .set(authHeader(admin.accessToken))
        .send({ name: `Deletable Qualification ${uniqueEmail('q')}` });

      const response = await request(app.getHttpServer())
        .delete(`/qualifications/${created.body.id}`)
        .set(authHeader(admin.accessToken));

      expect(response.status).toBe(204);

      const list = await request(app.getHttpServer())
        .get('/qualifications')
        .set(authHeader(admin.accessToken));

      expect(
        (list.body as Array<{ id: string }>).some(
          (q) => q.id === created.body.id,
        ),
      ).toBe(false);
    });
  });
});
