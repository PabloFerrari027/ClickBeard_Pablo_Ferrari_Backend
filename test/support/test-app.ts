import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { AppModule } from '../../src/app.module';
import { configureApp } from '../../src/configure-app';
import { NOTIFICATION_SENDER } from '../../src/modules/notification/core/application/ports/notification-sender.port';
import { EnvConfig } from '../../src/shared/config/env.config';
import { NotificationSenderSpy } from './notification-sender.spy';

export interface TestApp {
  app: INestApplication;
  notifications: NotificationSenderSpy;
}

/**
 * Boots the real application graph against the real Postgres/Redis, the
 * same way `main.ts` does via `configureApp`, with only the outbound
 * notification sender swapped for a spy so tests can read the raw
 * verification code out of the captured email body.
 *
 * Each spec file calls this once and owns its own app instance. `npm
 * run test:e2e` runs Jest with `--runInBand`: BullMQ's queue channels
 * are named globally (see `DOMAIN_EVENTS_CHANNELS`), so two of these
 * apps alive at once would compete as consumers on the same jobs and
 * could steal each other's verification-code events; running spec
 * files serially (each fully closing its app in `afterAll` before the
 * next boots) avoids that instead of scoping channel names per test.
 */
export async function createTestApp(): Promise<TestApp> {
  const notifications = new NotificationSenderSpy();

  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(NOTIFICATION_SENDER)
    .useValue(notifications)
    .compile();

  const app = moduleRef.createNestApplication();
  configureApp(app, app.get(EnvConfig));
  await app.init();

  return { app, notifications };
}
