import { Module } from '@nestjs/common';

import { QUALIFICATION_REPOSITORY } from '../qualification/core/application/ports/qualification-repository.port';
import { BARBER_REPOSITORY } from './core/application/ports/barber-repository.port';
import { USER_DIRECTORY } from './core/application/ports/user-directory.port';
import { AddQualificationToBarberUseCase } from './core/application/use-cases/add-qualification-to-barber.use-case';
import { CreateBarberUseCase } from './core/application/use-cases/create-barber.use-case';
import { GetBarberUseCase } from './core/application/use-cases/get-barber.use-case';
import { ListBarbersUseCase } from './core/application/use-cases/list-barbers.use-case';
import { RemoveQualificationFromBarberUseCase } from './core/application/use-cases/remove-qualification-from-barber.use-case';
import { UpdateBarberUseCase } from './core/application/use-cases/update-barber.use-case';
import { BarbersController } from './presentation/controllers/barbers.controller';

import type { QualificationRepository } from '../qualification/core/application/ports/qualification-repository.port';
import type { BarberRepository } from './core/application/ports/barber-repository.port';
import type { UserDirectory } from './core/application/ports/user-directory.port';

@Module({
  controllers: [BarbersController],
  providers: [
    {
      provide: CreateBarberUseCase,
      useFactory: (
        barberRepository: BarberRepository,
        qualificationRepository: QualificationRepository,
        userDirectory: UserDirectory,
      ) =>
        new CreateBarberUseCase(
          barberRepository,
          qualificationRepository,
          userDirectory,
        ),
      inject: [BARBER_REPOSITORY, QUALIFICATION_REPOSITORY, USER_DIRECTORY],
    },
    {
      provide: UpdateBarberUseCase,
      useFactory: (
        barberRepository: BarberRepository,
        qualificationRepository: QualificationRepository,
      ) => new UpdateBarberUseCase(barberRepository, qualificationRepository),
      inject: [BARBER_REPOSITORY, QUALIFICATION_REPOSITORY],
    },
    {
      provide: GetBarberUseCase,
      useFactory: (
        barberRepository: BarberRepository,
        qualificationRepository: QualificationRepository,
      ) => new GetBarberUseCase(barberRepository, qualificationRepository),
      inject: [BARBER_REPOSITORY, QUALIFICATION_REPOSITORY],
    },
    {
      provide: ListBarbersUseCase,
      useFactory: (
        barberRepository: BarberRepository,
        qualificationRepository: QualificationRepository,
      ) => new ListBarbersUseCase(barberRepository, qualificationRepository),
      inject: [BARBER_REPOSITORY, QUALIFICATION_REPOSITORY],
    },
    {
      provide: AddQualificationToBarberUseCase,
      useFactory: (
        barberRepository: BarberRepository,
        qualificationRepository: QualificationRepository,
        userDirectory: UserDirectory,
      ) =>
        new AddQualificationToBarberUseCase(
          barberRepository,
          qualificationRepository,
          userDirectory,
        ),
      inject: [BARBER_REPOSITORY, QUALIFICATION_REPOSITORY, USER_DIRECTORY],
    },
    {
      provide: RemoveQualificationFromBarberUseCase,
      useFactory: (
        barberRepository: BarberRepository,
        qualificationRepository: QualificationRepository,
        userDirectory: UserDirectory,
      ) =>
        new RemoveQualificationFromBarberUseCase(
          barberRepository,
          qualificationRepository,
          userDirectory,
        ),
      inject: [BARBER_REPOSITORY, QUALIFICATION_REPOSITORY, USER_DIRECTORY],
    },
  ],
})
export class BarberModule {}
