import { Global, Module } from '@nestjs/common';

import { EnvConfig } from './shared/config/env.config';

@Global()
@Module({
  imports: [],
  controllers: [],
  providers: [EnvConfig],
  exports: [EnvConfig],
})
export class AppModule {}
