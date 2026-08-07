import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { UserRole } from '../src/modules/identity/core/domain/enums/user-role.enum';
import {
  authHeader,
  getAdminSession,
  registerAndLogin,
  registerUser,
  Session,
  uniqueEmail,
} from './support/api.helpers';
import { NotificationSenderSpy } from './support/notification-sender.spy';
import { createTestApp } from './support/test-app';

describe('Barbers (e2e)', () => {
  let app: INestApplication;
  let notifications: NotificationSenderSpy;
  let admin: Session;
  let qualificationId: string;

  beforeAll(async () => {
    ({ app, notifications } = await createTestApp());
    admin = await getAdminSession(app, notifications);

    const qualificationResponse = await request(app.getHttpServer())
      .post('/qualifications')
      .set(authHeader(admin.accessToken))
      .send({ name: `Barbers Suite Qualification ${uniqueEmail('q')}` });
    qualificationId = qualificationResponse.body.id as string;
  });

  afterAll(async () => {
    await app.close();
  });

  async function createBarberUser() {
    return registerUser(app, { role: UserRole.BARBER });
  }

  describe('POST /barbers', () => {
    it('rejects an unauthenticated request with 401', async () => {
      const response = await request(app.getHttpServer())
        .post('/barbers')
        .send({});

      expect(response.status).toBe(401);
    });

    it('rejects a non-admin with 403', async () => {
      const { session } = await registerAndLogin(app, notifications);
      const barberUser = await createBarberUser();

      const response = await request(app.getHttpServer())
        .post('/barbers')
        .set(authHeader(session.accessToken))
        .send({
          userId: barberUser.id,
          age: 30,
          hiredAt: '2025-01-01T00:00:00.000Z',
          qualificationIds: [qualificationId],
        });

      expect(response.status).toBe(403);
    });

    it('creates a barber profile for a BARBER-role user as admin', async () => {
      const barberUser = await createBarberUser();

      const response = await request(app.getHttpServer())
        .post('/barbers')
        .set(authHeader(admin.accessToken))
        .send({
          userId: barberUser.id,
          age: 30,
          hiredAt: '2025-01-01T00:00:00.000Z',
          qualificationIds: [qualificationId],
        });

      expect(response.status).toBe(201);
      expect(response.body.id).toBe(barberUser.id);
      expect(response.body.userId).toBe(barberUser.id);
    });

    it('rejects creating a barber profile for a non-BARBER user', async () => {
      const clientUser = await registerUser(app);

      const response = await request(app.getHttpServer())
        .post('/barbers')
        .set(authHeader(admin.accessToken))
        .send({
          userId: clientUser.id,
          age: 30,
          hiredAt: '2025-01-01T00:00:00.000Z',
          qualificationIds: [qualificationId],
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('UserIsNotBarberError');
    });
  });

  describe('GET /barbers and GET /barbers/:id', () => {
    it('rejects an unauthenticated list request with 401', async () => {
      const response = await request(app.getHttpServer()).get('/barbers');

      expect(response.status).toBe(401);
    });

    it('lists barbers for any authenticated user', async () => {
      const barberUser = await createBarberUser();
      await request(app.getHttpServer())
        .post('/barbers')
        .set(authHeader(admin.accessToken))
        .send({
          userId: barberUser.id,
          age: 25,
          hiredAt: '2025-01-01T00:00:00.000Z',
          qualificationIds: [qualificationId],
        })
        .expect(201);

      const { session } = await registerAndLogin(app, notifications);

      const response = await request(app.getHttpServer())
        .get('/barbers')
        .set(authHeader(session.accessToken));

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.barbers)).toBe(true);
    });

    it('gets a single barber by id', async () => {
      const barberUser = await createBarberUser();
      await request(app.getHttpServer())
        .post('/barbers')
        .set(authHeader(admin.accessToken))
        .send({
          userId: barberUser.id,
          age: 40,
          hiredAt: '2025-01-01T00:00:00.000Z',
          qualificationIds: [qualificationId],
        })
        .expect(201);

      const response = await request(app.getHttpServer())
        .get(`/barbers/${barberUser.id}`)
        .set(authHeader(admin.accessToken));

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(barberUser.id);
    });
  });

  describe('PATCH /barbers/:id', () => {
    it('updates a barber as admin', async () => {
      const barberUser = await createBarberUser();
      await request(app.getHttpServer())
        .post('/barbers')
        .set(authHeader(admin.accessToken))
        .send({
          userId: barberUser.id,
          age: 22,
          hiredAt: '2025-01-01T00:00:00.000Z',
          qualificationIds: [qualificationId],
        })
        .expect(201);

      const response = await request(app.getHttpServer())
        .patch(`/barbers/${barberUser.id}`)
        .set(authHeader(admin.accessToken))
        .send({ age: 23 });

      expect(response.status).toBe(200);
      expect(response.body.age).toBe(23);
    });
  });

  describe('Barber qualifications', () => {
    it('adds and removes a qualification as admin', async () => {
      const barberUser = await createBarberUser();
      await request(app.getHttpServer())
        .post('/barbers')
        .set(authHeader(admin.accessToken))
        .send({
          userId: barberUser.id,
          age: 28,
          hiredAt: '2025-01-01T00:00:00.000Z',
          qualificationIds: [qualificationId],
        })
        .expect(201);

      const secondQualification = await request(app.getHttpServer())
        .post('/qualifications')
        .set(authHeader(admin.accessToken))
        .send({ name: `Second Qualification ${uniqueEmail('q')}` });
      const secondQualificationId = secondQualification.body.id as string;

      const addResponse = await request(app.getHttpServer())
        .post(`/barbers/${barberUser.id}/qualifications`)
        .set(authHeader(admin.accessToken))
        .send({ qualificationId: secondQualificationId });

      expect(addResponse.status).toBe(201);
      expect(addResponse.body.qualifications).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: secondQualificationId }),
        ]),
      );

      const removeResponse = await request(app.getHttpServer())
        .delete(
          `/barbers/${barberUser.id}/qualifications/${secondQualificationId}`,
        )
        .set(authHeader(admin.accessToken));

      expect(removeResponse.status).toBe(200);
      expect(
        (removeResponse.body.qualifications as Array<{ id: string }>).some(
          (q) => q.id === secondQualificationId,
        ),
      ).toBe(false);
    });
  });
});
