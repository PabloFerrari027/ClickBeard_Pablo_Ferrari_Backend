import { randomUUID } from 'node:crypto';

import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { UserRole } from '../../src/modules/identity/core/domain/enums/user-role.enum';
import { NotificationSenderSpy } from './notification-sender.spy';

export interface RegisteredUser {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface Session {
  userId: string;
  accessToken: string;
  refreshToken: string;
}

export interface RegisterOverrides {
  name?: string;
  email?: string;
  password?: string;
  birthDate?: string;
}

const DEFAULT_PASSWORD = 'Password123';
export const VERIFICATION_CODE_SUBJECT = 'Your ClickBeard verification code';
// Verification codes are always 6 numeric digits (see
// RandomVerificationCodeGenerator), so matching on digit shape is more
// robust than pinning to the surrounding template wording.
const CODE_PATTERN = /\b(\d{6})\b/;

export function uniqueEmail(prefix: string): string {
  return `${prefix}-${randomUUID()}@example.com`;
}

export function authHeader(token: string): { Authorization: string } {
  return { Authorization: `Bearer ${token}` };
}

export async function registerUser(
  app: INestApplication,
  overrides: RegisterOverrides = {},
): Promise<RegisteredUser> {
  const email = overrides.email ?? uniqueEmail('e2e');
  const password = overrides.password ?? DEFAULT_PASSWORD;
  const name = overrides.name ?? 'E2E Test User';

  const response = await request(app.getHttpServer())
    .post('/users')
    .send({
      name,
      email,
      password,
      birthDate: overrides.birthDate,
    })
    .expect(201);

  return {
    id: response.body.id as string,
    name,
    email,
    password,
    role: response.body.role as UserRole,
  };
}

/**
 * Changes a user's role via `PATCH /users/:id/role` — the only path to
 * ADMIN (or back to CLIENT) now that registration always creates a
 * CLIENT. Cannot be used for BARBER: that role is only granted by
 * creating a barber profile via `POST /barbers`. Requires an
 * authenticated admin session.
 */
export async function promoteUser(
  app: INestApplication,
  adminSession: Session,
  userId: string,
  role: UserRole,
): Promise<void> {
  await request(app.getHttpServer())
    .patch(`/users/${userId}/role`)
    .set(authHeader(adminSession.accessToken))
    .send({ role })
    .expect(200);
}

export function extractVerificationCode(body: string): string {
  const match = CODE_PATTERN.exec(body);

  if (!match) {
    throw new Error(
      `Could not find a verification code in notification body: ${body}`,
    );
  }

  return match[1];
}

/**
 * Drives the full 2FA login flow: confirms credentials, waits for the
 * async, BullMQ-driven verification code email to land in the spy,
 * validates it, then completes authentication for a real token pair.
 */
export async function completeLogin(
  app: INestApplication,
  notifications: NotificationSenderSpy,
  email: string,
  password: string,
): Promise<Session> {
  const since = notifications.count();

  const loginResponse = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email, password })
    .expect(200);

  const userId = loginResponse.body.user.id as string;

  const notification = await notifications.waitFor(
    (candidate) =>
      candidate.recipient === email &&
      candidate.subject === VERIFICATION_CODE_SUBJECT,
    { since },
  );
  const code = extractVerificationCode(notification.body);

  await request(app.getHttpServer())
    .post('/account-verification/validate')
    .send({ userId, code })
    .expect(200);

  const completeResponse = await request(app.getHttpServer())
    .post('/account-verification/complete')
    .send({ userId })
    .expect(200);

  return {
    userId,
    accessToken: completeResponse.body.accessToken as string,
    refreshToken: completeResponse.body.refreshToken as string,
  };
}

/**
 * Registration alone already triggers its own verification code email
 * (see VerificationCodeRequestConsumer) — draining it before any
 * subsequent login flow captures its own `since` marker guarantees that
 * marker excludes it instead of racing its (asynchronous, BullMQ-
 * driven) arrival. Without this, a poll right after login could match
 * that earlier, eventually-invalidated code instead of the one login
 * just generated. Call this after `registerUser` and before
 * `completeLogin` whenever they aren't already combined via
 * `registerAndLogin`.
 */
export async function drainRegistrationVerificationEmail(
  notifications: NotificationSenderSpy,
  email: string,
): Promise<void> {
  await notifications.waitFor(
    (candidate) =>
      candidate.recipient === email &&
      candidate.subject === VERIFICATION_CODE_SUBJECT,
  );
}

export async function registerAndLogin(
  app: INestApplication,
  notifications: NotificationSenderSpy,
  overrides: RegisterOverrides = {},
): Promise<{ user: RegisteredUser; session: Session }> {
  const user = await registerUser(app, overrides);

  await drainRegistrationVerificationEmail(notifications, user.email);

  const session = await completeLogin(
    app,
    notifications,
    user.email,
    user.password,
  );

  return { user, session };
}

/**
 * Logs in as the seeded bootstrap admin (see `database/seeders/`) —
 * ADMIN can only be created/promoted by an existing admin, so this is
 * the one account e2e tests can rely on to exercise admin-gated routes.
 * Requires `npm run seed:up` to have run against the target database.
 */
export async function getAdminSession(
  app: INestApplication,
  notifications: NotificationSenderSpy,
): Promise<Session> {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error(
      'SEED_ADMIN_EMAIL/SEED_ADMIN_PASSWORD are not set. Run `npm run seed:up` against the target database before the e2e suite.',
    );
  }

  return completeLogin(app, notifications, email, password);
}
