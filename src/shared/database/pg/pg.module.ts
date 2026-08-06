import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

import { SequelizeConfig } from '../../config/sequelize.config';
import { PgConfigModule } from './pg-config.module';
import { PgConnectionChecker } from './pg-connection.checker';

@Module({
  imports: [
    PgConfigModule,
    SequelizeModule.forRootAsync({
      imports: [PgConfigModule],
      useFactory: (sequelizeConfig: SequelizeConfig) =>
        sequelizeConfig.createSequelizeOptions(),
      inject: [SequelizeConfig],
    }),
  ],
  providers: [PgConnectionChecker],
  exports: [SequelizeModule],
})
export class PgModule {}
