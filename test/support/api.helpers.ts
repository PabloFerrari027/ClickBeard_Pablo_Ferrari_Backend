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
const VERIFICATION_CODE_SUBJECT = 'Your ClickBeard verification code';
const CODE_PATTERN = /verification code is (\S+)\./;

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
 * Promotes a user to a new role via `PATCH /users/:id/role` — the only
 * path to BARBER/ADMIN now that registration always creates a CLIENT.
 * Requires an authenticated admin session.
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

function extractVerificationCode(body: string): string {
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
  const loginResponse = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email, password })
    .expect(200);

  const userId = loginResponse.body.user.id as string;

  const notification = await notifications.waitFor(
    (candidate) =>
      candidate.recipient === email &&
      candidate.subject === VERIFICATION_CODE_SUBJECT,
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

export async function registerAndLogin(
  app: INestApplication,
  notifications: NotificationSenderSpy,
  overrides: RegisterOverrides = {},
): Promise<{ user: RegisteredUser; session: Session }> {
  const user = await registerUser(app, overrides);
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
