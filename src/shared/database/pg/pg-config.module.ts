import { Module } from '@nestjs/common';

import { PgConfig } from '../../config/pg.config';
import { SequelizeConfig } from '../../config/sequelize.config';

/**
 * Isolated so `SequelizeModule.forRootAsync` can pull `SequelizeConfig`
 * into its own factory via its `imports` option — a dynamic module only
 * sees providers declared by modules it explicitly imports, not the
 * providers of whichever module happens to import it.
 */
@Module({
  providers: [PgConfig, SequelizeConfig],
  exports: [PgConfig, SequelizeConfig],
})
export class PgConfigModule {}
