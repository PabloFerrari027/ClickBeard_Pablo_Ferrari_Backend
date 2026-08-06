import { Module } from '@nestjs/common';

import { QUALIFICATION_REPOSITORY } from '../qualification/core/application/ports/qualification-repository.port';
import { BARBER_REPOSITORY } from './core/application/ports/barber-repository.port';
import { AddQualificationToBarberUseCase } from './core/application/use-cases/add-qualification-to-barber.use-case';
import { CreateBarberUseCase } from './core/application/use-cases/create-barber.use-case';
import { GetBarberUseCase } from './core/application/use-cases/get-barber.use-case';
import { ListBarbersUseCase } from './core/application/use-cases/list-barbers.use-case';
import { RemoveQualificationFromBarberUseCase } from './core/application/use-cases/remove-qualification-from-barber.use-case';
import { UpdateBarberUseCase } from './core/application/use-cases/update-barber.use-case';
import { BarbersController } from './presentation/controllers/barbers.controller';
import { USER_REPOSITORY } from '../identity/core/application/ports/user-repository.port';

import type { QualificationRepository } from '../qualification/core/application/ports/qualification-repository.port';
import type { BarberRepository } from './core/application/ports/barber-repository.port';
import type { UserRepository } from '../identity/core/application/ports/user-repository.port';

@Module({
  controllers: [BarbersController],
  providers: [
    {
      provide: CreateBarberUseCase,
      useFactory: (
        barberRepository: BarberRepository,
        qualificationRepository: QualificationRepository,
        userRepository: UserRepository,
      ) =>
        new CreateBarberUseCase(
          barberRepository,
          qualificationRepository,
          userRepository,
        ),
      inject: [BARBER_REPOSITORY, QUALIFICATION_REPOSITORY, USER_REPOSITORY],
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
        userRepository: UserRepository,
      ) =>
        new AddQualificationToBarberUseCase(
          barberRepository,
          qualificationRepository,
          userRepository,
        ),
      inject: [BARBER_REPOSITORY, QUALIFICATION_REPOSITORY, USER_REPOSITORY],
    },
    {
      provide: RemoveQualificationFromBarberUseCase,
      useFactory: (
        barberRepository: BarberRepository,
        qualificationRepository: QualificationRepository,
        userRepository: UserRepository,
      ) =>
        new RemoveQualificationFromBarberUseCase(
          barberRepository,
          qualificationRepository,
          userRepository,
        ),
      inject: [BARBER_REPOSITORY, QUALIFICATION_REPOSITORY, USER_REPOSITORY],
    },
  ],
})
export class BarberModule {}
