import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { UserRole } from '../src/modules/identity/core/domain/enums/user-role.enum';
import {
  authHeader,
  completeLogin,
  drainRegistrationVerificationEmail,
  getAdminSession,
  promoteUser,
  registerAndLogin,
  registerUser,
  Session,
  uniqueEmail,
} from './support/api.helpers';
import { NotificationSenderSpy } from './support/notification-sender.spy';
import { createTestApp } from './support/test-app';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

describe('Appointments (e2e)', () => {
  let app: INestApplication;
  let notifications: NotificationSenderSpy;
  let admin: Session;
  let barberId: string;
  let qualificationId: string;

  beforeAll(async () => {
    ({ app, notifications } = await createTestApp());
    admin = await getAdminSession(app, notifications);

    const qualification = await request(app.getHttpServer())
      .post('/qualifications')
      .set(authHeader(admin.accessToken))
      .send({ name: `Appointments Suite Qualification ${uniqueEmail('q')}` });
    qualificationId = qualification.body.id as string;

    const barberUser = await registerUser(app);
    const barber = await request(app.getHttpServer())
      .post('/barbers')
      .set(authHeader(admin.accessToken))
      .send({
        email: barberUser.email,
        age: 30,
        hiredAt: '2025-01-01T00:00:00.000Z',
        qualificationIds: [qualificationId],
      });
    barberId = barber.body.id as string;
  });

  afterAll(async () => {
    await app.close();
  });

  /**
   * TimeSlot generation is business-hours-aware and rounds calendar days
   * using the server's local timezone, which this suite cannot assume —
   * so instead of computing a date and hoping it has open slots, it asks
   * the real server across the next few days and books whatever it
   * actually reports as available. Booking itself has no minimum notice
   * (only that the slot can't already be in the past), but a small buffer
   * is kept here so the slot doesn't tip into the past between fetching
   * the list and issuing the booking request.
   */
  async function findBookableSlot(token: string): Promise<string> {
    const now = Date.now();
    const minNoticeMs = 3 * 60 * 60 * 1000;

    for (let offsetDays = 0; offsetDays < 3; offsetDays += 1) {
      const dateParam = new Date(now + offsetDays * ONE_DAY_MS)
        .toISOString()
        .slice(0, 10);

      const response = await request(app.getHttpServer())
        .get('/appointments/time-slots')
        .set(authHeader(token))
        .query({ barberId, qualificationId, date: dateParam });

      const slots = (response.body.timeSlots ?? []) as Array<{
        startAt: string;
      }>;
      const bookable = slots.find(
        (slot) => new Date(slot.startAt).getTime() - now >= minNoticeMs,
      );

      if (bookable) {
        return bookable.startAt;
      }
    }

    throw new Error(
      'No bookable time slot found for the test barber in the next 3 days',
    );
  }

  /**
   * Creates a barber, demotes them back to CLIENT, and polls until their
   * barber profile is deactivated — deactivation runs off the async
   * `UserRoleChanged` event (see `UserRoleChangedConsumer`), not the
   * demotion request itself.
   */
  async function createDeactivatedBarberId(): Promise<string> {
    const barberUser = await registerUser(app);
    const barber = await request(app.getHttpServer())
      .post('/barbers')
      .set(authHeader(admin.accessToken))
      .send({
        email: barberUser.email,
        age: 30,
        hiredAt: '2025-01-01T00:00:00.000Z',
        qualificationIds: [qualificationId],
      });
    const deactivatedBarberId = barber.body.id as string;

    await promoteUser(app, admin, deactivatedBarberId, UserRole.CLIENT);

    const deadline = Date.now() + 10_000;
    for (;;) {
      const response = await request(app.getHttpServer())
        .get(`/barbers/${deactivatedBarberId}`)
        .set(authHeader(admin.accessToken));

      if (response.status === 404) {
        break;
      }

      if (Date.now() >= deadline) {
        throw new Error(
          `Timed out waiting for barber ${deactivatedBarberId} to be deactivated`,
        );
      }

      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    return deactivatedBarberId;
  }

  describe('GET /appointments/time-slots', () => {
    it('rejects an unauthenticated request with 401', async () => {
      const response = await request(app.getHttpServer())
        .get('/appointments/time-slots')
        .query({
          barberId,
          qualificationId,
          date: new Date().toISOString().slice(0, 10),
        });

      expect(response.status).toBe(401);
    });

    it('lists available slots for an authenticated user', async () => {
      const { session } = await registerAndLogin(app, notifications);

      const response = await request(app.getHttpServer())
        .get('/appointments/time-slots')
        .set(authHeader(session.accessToken))
        .query({
          barberId,
          qualificationId,
          date: new Date().toISOString().slice(0, 10),
        });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.timeSlots)).toBe(true);
    });
  });

  describe('POST /appointments', () => {
    it('rejects an unauthenticated request with 401', async () => {
      const response = await request(app.getHttpServer())
        .post('/appointments')
        .send({ barberId, qualificationId, startAt: new Date().toISOString() });

      expect(response.status).toBe(401);
    });

    it('books an appointment for the current user', async () => {
      const { session } = await registerAndLogin(app, notifications);
      const startAt = await findBookableSlot(session.accessToken);

      const response = await request(app.getHttpServer())
        .post('/appointments')
        .set(authHeader(session.accessToken))
        .send({ barberId, qualificationId, startAt });

      expect(response.status).toBe(201);
      expect(response.body.barberId).toBe(barberId);
      expect(response.body.status).toBe('SCHEDULED');
    });

    it('rejects booking a barber who was demoted back to CLIENT', async () => {
      const deactivatedBarberId = await createDeactivatedBarberId();
      const { session } = await registerAndLogin(app, notifications);
      const startAt = await findBookableSlot(session.accessToken);

      const response = await request(app.getHttpServer())
        .post('/appointments')
        .set(authHeader(session.accessToken))
        .send({ barberId: deactivatedBarberId, qualificationId, startAt });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('BarberNotFoundError');
    });
  });

  describe('Barbers booking with other barbers', () => {
    it('lets a BARBER-role user book an appointment with another barber and list it via /me', async () => {
      const { user: barberUser, session: barberSession } =
        await registerAndLogin(app, notifications);
      await request(app.getHttpServer())
        .post('/barbers')
        .set(authHeader(admin.accessToken))
        .send({
          email: barberUser.email,
          age: 30,
          hiredAt: '2025-01-01T00:00:00.000Z',
          qualificationIds: [qualificationId],
        })
        .expect(201);

      const startAt = await findBookableSlot(barberSession.accessToken);

      const created = await request(app.getHttpServer())
        .post('/appointments')
        .set(authHeader(barberSession.accessToken))
        .send({ barberId, qualificationId, startAt });

      expect(created.status).toBe(201);
      expect(created.body.customerId).toBe(barberUser.id);
      expect(created.body.barberId).toBe(barberId);

      const mine = await request(app.getHttpServer())
        .get('/appointments/me')
        .set(authHeader(barberSession.accessToken));

      expect(mine.status).toBe(200);
      expect(mine.body.appointments).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: created.body.id, barberId }),
        ]),
      );
    });
  });

  describe('GET /appointments/me and /appointments/:id for the assigned barber', () => {
    async function registerBarber(): Promise<{
      barberProfileId: string;
      session: Session;
      userId: string;
    }> {
      const barberUser = await registerUser(app);
      await drainRegistrationVerificationEmail(notifications, barberUser.email);
      const barberProfile = await request(app.getHttpServer())
        .post('/barbers')
        .set(authHeader(admin.accessToken))
        .send({
          email: barberUser.email,
          age: 30,
          hiredAt: '2025-01-01T00:00:00.000Z',
          qualificationIds: [qualificationId],
        });
      const session = await completeLogin(
        app,
        notifications,
        barberUser.email,
        barberUser.password,
      );

      return {
        barberProfileId: barberProfile.body.id as string,
        session,
        userId: barberUser.id,
      };
    }

    it("includes an appointment booked by a client in the assigned barber's own listing, and lets them fetch it by id while a stranger is denied", async () => {
      const { barberProfileId, session: barberSession } =
        await registerBarber();
      const { session: clientSession } = await registerAndLogin(
        app,
        notifications,
      );
      const startAt = await findBookableSlot(clientSession.accessToken);

      const created = await request(app.getHttpServer())
        .post('/appointments')
        .set(authHeader(clientSession.accessToken))
        .send({ barberId: barberProfileId, qualificationId, startAt })
        .expect(201);

      const mine = await request(app.getHttpServer())
        .get('/appointments/me')
        .set(authHeader(barberSession.accessToken));
      expect(mine.status).toBe(200);
      expect(mine.body.appointments).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: created.body.id }),
        ]),
      );

      const getById = await request(app.getHttpServer())
        .get(`/appointments/${created.body.id}`)
        .set(authHeader(barberSession.accessToken));
      expect(getById.status).toBe(200);

      const { session: strangerSession } = await registerAndLogin(
        app,
        notifications,
      );
      const strangerGetById = await request(app.getHttpServer())
        .get(`/appointments/${created.body.id}`)
        .set(authHeader(strangerSession.accessToken));
      expect(strangerGetById.status).toBe(403);
    });

    it('rejects a barber attempting to book an appointment with themselves', async () => {
      const { barberProfileId, session: barberSession } =
        await registerBarber();
      const startAt = await findBookableSlot(barberSession.accessToken);

      const response = await request(app.getHttpServer())
        .post('/appointments')
        .set(authHeader(barberSession.accessToken))
        .send({ barberId: barberProfileId, qualificationId, startAt });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('BarberCannotBookOwnAppointmentError');
    });
  });

  describe('GET /appointments/me, /appointments/:id and cancellation', () => {
    it('lets the owner see and cancel their own appointment, denies others, and notifies the owner by email', async () => {
      const { user: ownerUser, session: ownerSession } = await registerAndLogin(
        app,
        notifications,
      );
      const startAt = await findBookableSlot(ownerSession.accessToken);

      const created = await request(app.getHttpServer())
        .post('/appointments')
        .set(authHeader(ownerSession.accessToken))
        .send({ barberId, qualificationId, startAt })
        .expect(201);
      const appointmentId = created.body.id as string;

      const mine = await request(app.getHttpServer())
        .get('/appointments/me')
        .set(authHeader(ownerSession.accessToken));
      expect(mine.status).toBe(200);
      expect(mine.body.appointments).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: appointmentId }),
        ]),
      );

      const getById = await request(app.getHttpServer())
        .get(`/appointments/${appointmentId}`)
        .set(authHeader(ownerSession.accessToken));
      expect(getById.status).toBe(200);

      const { session: strangerSession } = await registerAndLogin(
        app,
        notifications,
      );
      const strangerGetById = await request(app.getHttpServer())
        .get(`/appointments/${appointmentId}`)
        .set(authHeader(strangerSession.accessToken));
      expect(strangerGetById.status).toBe(403);

      const strangerCancel = await request(app.getHttpServer())
        .delete(`/appointments/${appointmentId}`)
        .set(authHeader(strangerSession.accessToken));
      expect(strangerCancel.status).toBe(403);

      const cancel = await request(app.getHttpServer())
        .delete(`/appointments/${appointmentId}`)
        .set(authHeader(ownerSession.accessToken));
      expect(cancel.status).toBe(200);
      expect(cancel.body.status).toBe('CANCELLED');

      const notification = await notifications.waitFor(
        (candidate) =>
          candidate.recipient === ownerUser.email &&
          candidate.subject ===
            'Your ClickBeard appointment has been cancelled',
      );
      expect(notification.body).toContain('cancelled');
    });
  });

  describe('Admin-only listings', () => {
    it('rejects a non-admin with 403 on /today and /future', async () => {
      const { session } = await registerAndLogin(app, notifications);

      const today = await request(app.getHttpServer())
        .get('/appointments/today')
        .set(authHeader(session.accessToken));
      expect(today.status).toBe(403);

      const future = await request(app.getHttpServer())
        .get('/appointments/future')
        .set(authHeader(session.accessToken));
      expect(future.status).toBe(403);
    });

    it('lets an admin list today and future appointments, including a freshly booked one in /future', async () => {
      const { session: ownerSession } = await registerAndLogin(
        app,
        notifications,
      );
      const startAt = await findBookableSlot(ownerSession.accessToken);

      const created = await request(app.getHttpServer())
        .post('/appointments')
        .set(authHeader(ownerSession.accessToken))
        .send({ barberId, qualificationId, startAt })
        .expect(201);

      const todayResponse = await request(app.getHttpServer())
        .get('/appointments/today')
        .set(authHeader(admin.accessToken));
      expect(todayResponse.status).toBe(200);
      expect(Array.isArray(todayResponse.body.appointments)).toBe(true);

      const futureResponse = await request(app.getHttpServer())
        .get('/appointments/future')
        .set(authHeader(admin.accessToken));
      expect(futureResponse.status).toBe(200);
      expect(futureResponse.body.appointments).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: created.body.id }),
        ]),
      );
    });

    it('narrows /future to a startAt/endAt time period', async () => {
      const { session: ownerSession } = await registerAndLogin(
        app,
        notifications,
      );
      const startAt = await findBookableSlot(ownerSession.accessToken);

      const created = await request(app.getHttpServer())
        .post('/appointments')
        .set(authHeader(ownerSession.accessToken))
        .send({ barberId, qualificationId, startAt })
        .expect(201);

      const bookedAt = new Date(startAt);

      const including = await request(app.getHttpServer())
        .get('/appointments/future')
        .set(authHeader(admin.accessToken))
        .query({
          startAt: new Date(bookedAt.getTime() - ONE_DAY_MS).toISOString(),
          endAt: new Date(bookedAt.getTime() + ONE_DAY_MS).toISOString(),
        });
      expect(including.status).toBe(200);
      expect(including.body.appointments).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: created.body.id }),
        ]),
      );

      const excluding = await request(app.getHttpServer())
        .get('/appointments/future')
        .set(authHeader(admin.accessToken))
        .query({
          endAt: new Date(bookedAt.getTime() - ONE_DAY_MS).toISOString(),
        });
      expect(excluding.status).toBe(200);
      expect(excluding.body.appointments).not.toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: created.body.id }),
        ]),
      );
    });

    it('rejects a /future period with startAt after endAt with 400', async () => {
      const response = await request(app.getHttpServer())
        .get('/appointments/future')
        .set(authHeader(admin.accessToken))
        .query({
          startAt: new Date(Date.now() + 2 * ONE_DAY_MS).toISOString(),
          endAt: new Date(Date.now() + ONE_DAY_MS).toISOString(),
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('InvalidAppointmentPeriodError');
    });
  });

  describe('PATCH /appointments/:id/cancel', () => {
    it('rejects an unauthenticated request with 401', async () => {
      const response = await request(app.getHttpServer())
        .patch('/appointments/00000000-0000-0000-0000-000000000000/cancel')
        .send({ reason: 'Barber is sick' });

      expect(response.status).toBe(401);
    });

    it('rejects a non-admin with 403', async () => {
      const { session: ownerSession } = await registerAndLogin(
        app,
        notifications,
      );
      const startAt = await findBookableSlot(ownerSession.accessToken);
      const created = await request(app.getHttpServer())
        .post('/appointments')
        .set(authHeader(ownerSession.accessToken))
        .send({ barberId, qualificationId, startAt })
        .expect(201);

      const response = await request(app.getHttpServer())
        .patch(`/appointments/${created.body.id}/cancel`)
        .set(authHeader(ownerSession.accessToken))
        .send({ reason: 'Barber is sick' });

      expect(response.status).toBe(403);
    });

    it('rejects a missing/too short reason with 400', async () => {
      const { session: ownerSession } = await registerAndLogin(
        app,
        notifications,
      );
      const startAt = await findBookableSlot(ownerSession.accessToken);
      const created = await request(app.getHttpServer())
        .post('/appointments')
        .set(authHeader(ownerSession.accessToken))
        .send({ barberId, qualificationId, startAt })
        .expect(201);

      const response = await request(app.getHttpServer())
        .patch(`/appointments/${created.body.id}/cancel`)
        .set(authHeader(admin.accessToken))
        .send({ reason: 'x' });

      expect(response.status).toBe(400);
    });

    it('returns 404 for a non-existent appointment', async () => {
      const response = await request(app.getHttpServer())
        .patch('/appointments/00000000-0000-0000-0000-000000000000/cancel')
        .set(authHeader(admin.accessToken))
        .send({ reason: 'Barber is sick' });

      expect(response.status).toBe(404);
    });

    it('lets an admin cancel any appointment with a reason, bypassing the 2h window, and notifies the customer by email', async () => {
      const { user: ownerUser, session: ownerSession } = await registerAndLogin(
        app,
        notifications,
      );
      const startAt = await findBookableSlot(ownerSession.accessToken);
      const created = await request(app.getHttpServer())
        .post('/appointments')
        .set(authHeader(ownerSession.accessToken))
        .send({ barberId, qualificationId, startAt })
        .expect(201);

      const response = await request(app.getHttpServer())
        .patch(`/appointments/${created.body.id}/cancel`)
        .set(authHeader(admin.accessToken))
        .send({ reason: 'Barber called in sick' });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('CANCELLED');
      expect(response.body.cancellationReason).toBe('Barber called in sick');

      const notification = await notifications.waitFor(
        (candidate) =>
          candidate.recipient === ownerUser.email &&
          candidate.subject ===
            'Your ClickBeard appointment has been cancelled',
      );
      expect(notification.body).toContain('Barber called in sick');

      const alreadyCancelled = await request(app.getHttpServer())
        .patch(`/appointments/${created.body.id}/cancel`)
        .set(authHeader(admin.accessToken))
        .send({ reason: 'Trying again' });
      expect(alreadyCancelled.status).toBe(409);
    });
  });

  describe('Booking during a barber unavailability period', () => {
    let unavailableBarberId: string;

    beforeAll(async () => {
      const barberUser = await registerUser(app);
      const barber = await request(app.getHttpServer())
        .post('/barbers')
        .set(authHeader(admin.accessToken))
        .send({
          email: barberUser.email,
          age: 30,
          hiredAt: '2025-01-01T00:00:00.000Z',
          qualificationIds: [qualificationId],
        });
      unavailableBarberId = barber.body.id as string;

      // Cover a wide future window so the fixed 08:00-18:00 grid this
      // barber would otherwise expose is entirely blocked, regardless of
      // which day the test environment's clock falls on.
      await request(app.getHttpServer())
        .post(`/barbers/${unavailableBarberId}/unavailabilities`)
        .set(authHeader(admin.accessToken))
        .send({
          startAt: new Date(Date.now()).toISOString(),
          endAt: new Date(Date.now() + 30 * ONE_DAY_MS).toISOString(),
          reason: 'Extended sick leave',
        })
        .expect(201);
    });

    it('excludes every slot from the time-slots listing', async () => {
      const { session } = await registerAndLogin(app, notifications);
      const dateParam = new Date().toISOString().slice(0, 10);

      const response = await request(app.getHttpServer())
        .get('/appointments/time-slots')
        .set(authHeader(session.accessToken))
        .query({
          barberId: unavailableBarberId,
          qualificationId,
          date: dateParam,
        });

      expect(response.status).toBe(200);
      expect(response.body.timeSlots).toEqual([]);
    });

    it('rejects booking with 409 BarberUnavailableError', async () => {
      const { session } = await registerAndLogin(app, notifications);

      // Tomorrow at 09:00 business-local time (America/Sao_Paulo,
      // UTC-3): always grid-aligned (top of the hour) and within
      // business hours — so this fails on unavailability, not slot
      // alignment. Built via UTC arithmetic (not setHours, which reads
      // the *host* machine's timezone) so it means the same wall-clock
      // instant regardless of where the test runs.
      const tomorrowUtc = new Date(Date.now() + ONE_DAY_MS);
      const tomorrow = new Date(
        Date.UTC(
          tomorrowUtc.getUTCFullYear(),
          tomorrowUtc.getUTCMonth(),
          tomorrowUtc.getUTCDate(),
          9 + 3,
          0,
          0,
          0,
        ),
      );

      const response = await request(app.getHttpServer())
        .post('/appointments')
        .set(authHeader(session.accessToken))
        .send({
          barberId: unavailableBarberId,
          qualificationId,
          startAt: tomorrow.toISOString(),
        });

      expect(response.status).toBe(409);
      expect(response.body.error).toBe('BarberUnavailableError');
    });
  });
});
