import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';

import { EnvConfig } from './shared/config/env.config';
import { DomainErrorFilter } from './shared/presentation/filters/domain-error.filter';

/**
 * Everything `main.ts` applies to a real `INestApplication` before
 * listening — factored out so `test/app.e2e-spec.ts` can call the exact
 * same setup instead of hand-duplicating it. A test harness that drifts
 * from this (e.g. forgetting `DomainErrorFilter`) produces misleading
 * false negatives, not real bug reports — this makes that impossible.
 */
export function configureApp(
  app: INestApplication,
  envConfig: EnvConfig,
): void {
  app.use(helmet());
  app.enableCors({ origin: envConfig.corsOrigins, credentials: true });

  app.useGlobalFilters(new DomainErrorFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('ClickBeard API')
    .setDescription('ClickBeard API documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);
}
