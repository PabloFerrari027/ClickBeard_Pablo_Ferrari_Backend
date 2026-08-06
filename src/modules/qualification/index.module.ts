import { Module } from '@nestjs/common';

import { BARBER_REPOSITORY } from '../barber/core/application/ports/barber-repository.port';
import { USER_DIRECTORY } from '../barber/core/application/ports/user-directory.port';
import { QUALIFICATION_REPOSITORY } from './core/application/ports/qualification-repository.port';
import { CreateQualificationUseCase } from './core/application/use-cases/create-qualification.use-case';
import { DeleteQualificationUseCase } from './core/application/use-cases/delete-qualification.use-case';
import { ListQualificationsUseCase } from './core/application/use-cases/list-qualifications.use-case';
import { UpdateQualificationUseCase } from './core/application/use-cases/update-qualification.use-case';
import { QualificationsController } from './presentation/controllers/qualifications.controller';

import type { BarberRepository } from '../barber/core/application/ports/barber-repository.port';
import type { UserDirectory } from '../barber/core/application/ports/user-directory.port';
import type { QualificationRepository } from './core/application/ports/qualification-repository.port';

@Module({
  controllers: [QualificationsController],
  providers: [
    {
      provide: CreateQualificationUseCase,
      useFactory: (
        qualificationRepository: QualificationRepository,
        userDirectory: UserDirectory,
      ) =>
        new CreateQualificationUseCase(qualificationRepository, userDirectory),
      inject: [QUALIFICATION_REPOSITORY, USER_DIRECTORY],
    },
    {
      provide: UpdateQualificationUseCase,
      useFactory: (
        qualificationRepository: QualificationRepository,
        userDirectory: UserDirectory,
      ) =>
        new UpdateQualificationUseCase(qualificationRepository, userDirectory),
      inject: [QUALIFICATION_REPOSITORY, USER_DIRECTORY],
    },
    {
      provide: DeleteQualificationUseCase,
      useFactory: (
        qualificationRepository: QualificationRepository,
        barberRepository: BarberRepository,
        userDirectory: UserDirectory,
      ) =>
        new DeleteQualificationUseCase(
          qualificationRepository,
          barberRepository,
          userDirectory,
        ),
      inject: [QUALIFICATION_REPOSITORY, BARBER_REPOSITORY, USER_DIRECTORY],
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
