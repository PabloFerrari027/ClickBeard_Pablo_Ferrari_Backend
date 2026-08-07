import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configureApp } from './configure-app';
import { EnvConfig } from './shared/config/env.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const envConfig = app.get(EnvConfig);

  configureApp(app, envConfig);

  // Without this, Nest never listens for SIGTERM/SIGINT, so a container
  // orchestrator stopping this process skips every OnModuleDestroy hook
  // (closing the Postgres/Redis/BullMQ connections cleanly) entirely.
  app.enableShutdownHooks();

  await app.listen(envConfig.port);
}

bootstrap().catch((error: unknown) => {
  new Logger('Bootstrap').error('Failed to start the application.', error);
  process.exitCode = 1;
});
