import { Global, Module } from '@nestjs/common';

import { PgModule } from './pg/pg.module';

/**
 * Single entry point AppModule imports for persistence. Global so every
 * domain module's `SequelizeModule.forFeature([...])` resolves against
 * the one root connection without importing this module itself.
 */
@Global()
@Module({
  imports: [PgModule],
  exports: [PgModule],
})
export class DatabaseModule {}
