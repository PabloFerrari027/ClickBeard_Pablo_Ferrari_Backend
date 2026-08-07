import { Global, Module } from '@nestjs/common';

import { AccountVerificationModule } from './modules/account-verification/index.module';
import { AnalyticsModule } from './modules/analytics/index.module';
import { AuthModule } from './modules/auth/index.module';
import { BarberModule } from './modules/barber/index.module';
import { IdentityModule } from './modules/identity/index.module';
import { NotificationModule } from './modules/notification/index.module';
import { QualificationModule } from './modules/qualification/index.module';
import { SchedulingModule } from './modules/scheduling/index.module';
import { RedisCacheModule } from './shared/cache/redis-cache.module';
import { EnvConfig } from './shared/config/env.config';
import { DatabaseModule } from './shared/database/database.module';
import { QueueModule } from './shared/queue/queue.module';

@Global()
@Module({
  imports: [
    DatabaseModule,
    RedisCacheModule,
    QueueModule,
    IdentityModule,
    AuthModule,
    AccountVerificationModule,
    BarberModule,
    QualificationModule,
    SchedulingModule,
    NotificationModule,
    AnalyticsModule,
  ],
  controllers: [],
  providers: [EnvConfig],
  exports: [EnvConfig],
})
export class AppModule {}
