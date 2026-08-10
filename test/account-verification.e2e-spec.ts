import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import {
  drainRegistrationVerificationEmail,
  extractVerificationCode,
  registerUser,
} from './support/api.helpers';
import { NotificationSenderSpy } from './support/notification-sender.spy';
import { createTestApp } from './support/test-app';

describe('Account Verification (e2e)', () => {
  let app: INestApplication;
  let notifications: NotificationSenderSpy;

  beforeAll(async () => {
    ({ app, notifications } = await createTestApp());
  });

  afterAll(async () => {
    await app.close();
  });

  async function loginAndGetUserId(email: string, password: string) {
    await drainRegistrationVerificationEmail(notifications, email);

    const since = notifications.count();

    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(200);

    return { userId: response.body.user.id as string, since };
  }

  describe('POST /account-verification/validate', () => {
    it('maps VerificationCodeNotFoundError to 404 when no code was ever generated', async () => {
      const response = await request(app.getHttpServer())
        .post('/account-verification/validate')
        .send({
          userId: '00000000-0000-0000-0000-000000000000',
          code: '000000',
        });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('VerificationCodeNotFoundError');
    });

    it('maps InvalidVerificationCodeError to 400 for a wrong code', async () => {
      const user = await registerUser(app);
      const { userId, since } = await loginAndGetUserId(
        user.email,
        user.password,
      );

      await notifications.waitFor(
        (n) =>
          n.recipient === user.email &&
          n.subject === 'Your ClickBeard verification code',
        { since },
      );

      const response = await request(app.getHttpServer())
        .post('/account-verification/validate')
        .send({ userId, code: 'clearly-wrong' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('InvalidVerificationCodeError');
    });

    it('accepts the correct code', async () => {
      const user = await registerUser(app);
      const { userId, since } = await loginAndGetUserId(
        user.email,
        user.password,
      );

      const notification = await notifications.waitFor(
        (n) =>
          n.recipient === user.email &&
          n.subject === 'Your ClickBeard verification code',
        { since },
      );
      const code = extractVerificationCode(notification.body);

      const response = await request(app.getHttpServer())
        .post('/account-verification/validate')
        .send({ userId, code });

      expect(response.status).toBe(200);
      expect(response.body.verified).toBe(true);
    });
  });

  describe('POST /account-verification/complete', () => {
    it('maps VerificationNotCompletedError to 400 when validation never ran', async () => {
      const user = await registerUser(app);
      const { userId } = await loginAndGetUserId(user.email, user.password);

      const response = await request(app.getHttpServer())
        .post('/account-verification/complete')
        .send({ userId });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('VerificationNotCompletedError');
    });

    it('issues a token pair once the code has been validated', async () => {
      const user = await registerUser(app);
      const { userId, since } = await loginAndGetUserId(
        user.email,
        user.password,
      );

      const notification = await notifications.waitFor(
        (n) =>
          n.recipient === user.email &&
          n.subject === 'Your ClickBeard verification code',
        { since },
      );
      const code = extractVerificationCode(notification.body);

      await request(app.getHttpServer())
        .post('/account-verification/validate')
        .send({ userId, code })
        .expect(200);

      const response = await request(app.getHttpServer())
        .post('/account-verification/complete')
        .send({ userId });

      expect(response.status).toBe(200);
      expect(response.body.accessToken).toEqual(expect.any(String));
      expect(response.body.refreshToken).toEqual(expect.any(String));
    });
  });

  describe('POST /account-verification/resend', () => {
    it('invalidates the previous code and issues a new one', async () => {
      const user = await registerUser(app);
      const { userId, since } = await loginAndGetUserId(
        user.email,
        user.password,
      );

      const firstNotification = await notifications.waitFor(
        (n) =>
          n.recipient === user.email &&
          n.subject === 'Your ClickBeard verification code',
        { since },
      );
      const firstCode = extractVerificationCode(firstNotification.body);

      const resendResponse = await request(app.getHttpServer())
        .post('/account-verification/resend')
        .send({ userId, email: user.email, name: user.name });

      expect(resendResponse.status).toBe(200);

      const secondNotification = await notifications.waitFor(
        (n) =>
          n.recipient === user.email &&
          n.subject === 'Your ClickBeard verification code' &&
          n.body !== firstNotification.body,
        { since },
      );
      const secondCode = extractVerificationCode(secondNotification.body);

      expect(secondCode).not.toBe(firstCode);

      const validateWithOldCode = await request(app.getHttpServer())
        .post('/account-verification/validate')
        .send({ userId, code: firstCode });
      expect(validateWithOldCode.status).toBe(400);

      const validateWithNewCode = await request(app.getHttpServer())
        .post('/account-verification/validate')
        .send({ userId, code: secondCode });
      expect(validateWithNewCode.status).toBe(200);
    });
  });
});
