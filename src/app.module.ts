import { Global, Module } from '@nestjs/common';

import { EnvConfig } from './shared/config/env.config';
import { DatabaseModule } from './shared/database/database.module';

@Global()
@Module({
  imports: [DatabaseModule],
  controllers: [],
  providers: [EnvConfig],
  exports: [EnvConfig],
})
export class AppModule {}
