import { Module } from '@nestjs/common';

import { BARBER_REPOSITORY } from '../barber/core/application/ports/barber-repository.port';
import { QUALIFICATION_REPOSITORY } from './core/application/ports/qualification-repository.port';
import { CreateQualificationUseCase } from './core/application/use-cases/create-qualification.use-case';
import { DeleteQualificationUseCase } from './core/application/use-cases/delete-qualification.use-case';
import { ListQualificationsUseCase } from './core/application/use-cases/list-qualifications.use-case';
import { UpdateQualificationUseCase } from './core/application/use-cases/update-qualification.use-case';
import { QualificationsController } from './presentation/controllers/qualifications.controller';
import { USER_REPOSITORY } from '../identity/core/application/ports/user-repository.port';

import type { BarberRepository } from '../barber/core/application/ports/barber-repository.port';
import type { QualificationRepository } from './core/application/ports/qualification-repository.port';
import type { UserRepository } from '../identity/core/application/ports/user-repository.port';

@Module({
  controllers: [QualificationsController],
  providers: [
    {
      provide: CreateQualificationUseCase,
      useFactory: (
        qualificationRepository: QualificationRepository,
        userRepository: UserRepository,
      ) =>
        new CreateQualificationUseCase(qualificationRepository, userRepository),
      inject: [QUALIFICATION_REPOSITORY, USER_REPOSITORY],
    },
    {
      provide: UpdateQualificationUseCase,
      useFactory: (
        qualificationRepository: QualificationRepository,
        userRepository: UserRepository,
      ) =>
        new UpdateQualificationUseCase(qualificationRepository, userRepository),
      inject: [QUALIFICATION_REPOSITORY, USER_REPOSITORY],
    },
    {
      provide: DeleteQualificationUseCase,
      useFactory: (
        qualificationRepository: QualificationRepository,
        barberRepository: BarberRepository,
        userRepository: UserRepository,
      ) =>
        new DeleteQualificationUseCase(
          qualificationRepository,
          barberRepository,
          userRepository,
        ),
      inject: [QUALIFICATION_REPOSITORY, BARBER_REPOSITORY, USER_REPOSITORY],
    },
    {
      provide: ListQualificationsUseCase,
      useFactory: (qualificationRepository: QualificationRepository) =>
        new ListQualificationsUseCase(qualificationRepository),
      inject: [QUALIFICATION_REPOSITORY],
    },
  ],
})
export class QualificationModule {}
