import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { UserRole } from '../src/modules/identity/core/domain/enums/user-role.enum';
import {
  authHeader,
  getAdminSession,
  promoteUser,
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
    const user = await registerUser(app);
    await promoteUser(app, admin, user.id, UserRole.BARBER);
    return { ...user, role: UserRole.BARBER };
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
          email: barberUser.email,
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
          email: barberUser.email,
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
          email: clientUser.email,
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
          email: barberUser.email,
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
          email: barberUser.email,
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
          email: barberUser.email,
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
          email: barberUser.email,
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

  describe('Barber unavailability', () => {
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;

    async function createUnavailabilityTestBarber(): Promise<string> {
      const barberUser = await createBarberUser();
      const response = await request(app.getHttpServer())
        .post('/barbers')
        .set(authHeader(admin.accessToken))
        .send({
          email: barberUser.email,
          age: 30,
          hiredAt: '2025-01-01T00:00:00.000Z',
          qualificationIds: [qualificationId],
        })
        .expect(201);

      return response.body.id as string;
    }

    it('rejects an unauthenticated create request with 401', async () => {
      const barberId = await createUnavailabilityTestBarber();

      const response = await request(app.getHttpServer())
        .post(`/barbers/${barberId}/unavailabilities`)
        .send({
          startAt: '2026-08-10T00:00:00.000Z',
          endAt: '2026-08-12T00:00:00.000Z',
          reason: 'Sick leave',
        });

      expect(response.status).toBe(401);
    });

    it('rejects a non-admin with 403', async () => {
      const barberId = await createUnavailabilityTestBarber();
      const { session } = await registerAndLogin(app, notifications);

      const response = await request(app.getHttpServer())
        .post(`/barbers/${barberId}/unavailabilities`)
        .set(authHeader(session.accessToken))
        .send({
          startAt: '2026-08-10T00:00:00.000Z',
          endAt: '2026-08-12T00:00:00.000Z',
          reason: 'Sick leave',
        });

      expect(response.status).toBe(403);
    });

    it('rejects an invalid period (end before start) with 400', async () => {
      const barberId = await createUnavailabilityTestBarber();

      const response = await request(app.getHttpServer())
        .post(`/barbers/${barberId}/unavailabilities`)
        .set(authHeader(admin.accessToken))
        .send({
          startAt: '2026-08-12T00:00:00.000Z',
          endAt: '2026-08-10T00:00:00.000Z',
          reason: 'Sick leave',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('InvalidUnavailabilityPeriodError');
    });

    it('rejects a too-short reason with 400', async () => {
      const barberId = await createUnavailabilityTestBarber();

      const response = await request(app.getHttpServer())
        .post(`/barbers/${barberId}/unavailabilities`)
        .set(authHeader(admin.accessToken))
        .send({
          startAt: '2026-08-10T00:00:00.000Z',
          endAt: '2026-08-12T00:00:00.000Z',
          reason: 'x',
        });

      expect(response.status).toBe(400);
    });

    it('returns 404 for a non-existent barber', async () => {
      const response = await request(app.getHttpServer())
        .post('/barbers/00000000-0000-0000-0000-000000000000/unavailabilities')
        .set(authHeader(admin.accessToken))
        .send({
          startAt: '2026-08-10T00:00:00.000Z',
          endAt: '2026-08-12T00:00:00.000Z',
          reason: 'Sick leave',
        });

      expect(response.status).toBe(404);
    });

    it('creates, lists and deletes an unavailability period, rejecting an overlapping one', async () => {
      const barberId = await createUnavailabilityTestBarber();

      const createResponse = await request(app.getHttpServer())
        .post(`/barbers/${barberId}/unavailabilities`)
        .set(authHeader(admin.accessToken))
        .send({
          startAt: '2026-09-01T00:00:00.000Z',
          endAt: '2026-09-03T00:00:00.000Z',
          reason: 'Vacation',
        });
      expect(createResponse.status).toBe(201);
      const unavailabilityId = createResponse.body.id as string;

      const overlapResponse = await request(app.getHttpServer())
        .post(`/barbers/${barberId}/unavailabilities`)
        .set(authHeader(admin.accessToken))
        .send({
          startAt: '2026-09-02T00:00:00.000Z',
          endAt: '2026-09-04T00:00:00.000Z',
          reason: 'Another reason',
        });
      expect(overlapResponse.status).toBe(409);
      expect(overlapResponse.body.error).toBe(
        'BarberUnavailabilityOverlapError',
      );

      const listResponse = await request(app.getHttpServer())
        .get(`/barbers/${barberId}/unavailabilities`)
        .set(authHeader(admin.accessToken));
      expect(listResponse.status).toBe(200);
      expect(listResponse.body.unavailabilities).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: unavailabilityId }),
        ]),
      );

      const deleteResponse = await request(app.getHttpServer())
        .delete(`/barbers/${barberId}/unavailabilities/${unavailabilityId}`)
        .set(authHeader(admin.accessToken));
      expect(deleteResponse.status).toBe(204);

      const listAfterDelete = await request(app.getHttpServer())
        .get(`/barbers/${barberId}/unavailabilities`)
        .set(authHeader(admin.accessToken));
      expect(
        (listAfterDelete.body.unavailabilities as Array<{ id: string }>).some(
          (u) => u.id === unavailabilityId,
        ),
      ).toBe(false);
    });

    it('cascades: marking a barber unavailable cancels a conflicting appointment and notifies the customer', async () => {
      const barberId = await createUnavailabilityTestBarber();
      const { user: customer, session: customerSession } =
        await registerAndLogin(app, notifications);

      // Find a bookable slot in the next few days, same approach as
      // appointments.e2e-spec.ts: ask the real server instead of guessing.
      const now = Date.now();
      const minNoticeMs = 3 * 60 * 60 * 1000;
      let bookedStartAt: string | undefined;

      for (let offsetDays = 0; offsetDays < 3; offsetDays += 1) {
        const dateParam = new Date(now + offsetDays * ONE_DAY_MS)
          .toISOString()
          .slice(0, 10);

        const slotsResponse = await request(app.getHttpServer())
          .get('/appointments/time-slots')
          .set(authHeader(customerSession.accessToken))
          .query({ barberId, qualificationId, date: dateParam });

        const slots = (slotsResponse.body.timeSlots ?? []) as Array<{
          startAt: string;
        }>;
        const bookable = slots.find(
          (slot) => new Date(slot.startAt).getTime() - now >= minNoticeMs,
        );

        if (bookable) {
          bookedStartAt = bookable.startAt;
          break;
        }
      }

      if (!bookedStartAt) {
        throw new Error(
          'No bookable time slot found for the unavailability cascade test',
        );
      }

      const created = await request(app.getHttpServer())
        .post('/appointments')
        .set(authHeader(customerSession.accessToken))
        .send({ barberId, qualificationId, startAt: bookedStartAt })
        .expect(201);

      const bookedDate = new Date(bookedStartAt);
      const dayStart = new Date(
        bookedDate.getFullYear(),
        bookedDate.getMonth(),
        bookedDate.getDate(),
      );
      const dayAfter = new Date(dayStart.getTime() + ONE_DAY_MS);

      const unavailabilityResponse = await request(app.getHttpServer())
        .post(`/barbers/${barberId}/unavailabilities`)
        .set(authHeader(admin.accessToken))
        .send({
          startAt: dayStart.toISOString(),
          endAt: dayAfter.toISOString(),
          reason: 'Sick leave',
        });
      expect(unavailabilityResponse.status).toBe(201);

      const cancelledAppointment = await request(app.getHttpServer())
        .get(`/appointments/${created.body.id}`)
        .set(authHeader(customerSession.accessToken))
        .expect(200);

      // The cascade runs asynchronously off a queue worker, same as the
      // 2FA code generation flow — poll instead of asserting immediately.
      const deadline = Date.now() + 10_000;
      let status = cancelledAppointment.body.status as string;
      let latestBody = cancelledAppointment.body as {
        status: string;
        cancellationReason: string | null;
      };

      while (status !== 'CANCELLED' && Date.now() < deadline) {
        await new Promise((resolve) => setTimeout(resolve, 200));
        const poll = await request(app.getHttpServer())
          .get(`/appointments/${created.body.id}`)
          .set(authHeader(customerSession.accessToken));
        latestBody = poll.body as typeof latestBody;
        status = latestBody.status;
      }

      expect(status).toBe('CANCELLED');
      expect(latestBody.cancellationReason).toContain('Sick leave');

      const notification = await notifications.waitFor(
        (candidate) =>
          candidate.recipient === customer.email &&
          candidate.subject ===
            'Your ClickBeard appointment has been cancelled',
      );
      expect(notification.body).toContain('Sick leave');
    });
  });
});
