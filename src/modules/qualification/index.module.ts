import { forwardRef, Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

import { BARBER_REPOSITORY } from '../barber/core/application/ports/barber-repository.port';
import { BarberModule } from '../barber/index.module';
import { QUALIFICATION_REPOSITORY } from './core/application/ports/qualification-repository.port';
import { CreateQualificationUseCase } from './core/application/use-cases/create-qualification.use-case';
import { DeleteQualificationUseCase } from './core/application/use-cases/delete-qualification.use-case';
import { ListQualificationsUseCase } from './core/application/use-cases/list-qualifications.use-case';
import { UpdateQualificationUseCase } from './core/application/use-cases/update-qualification.use-case';
import { QualificationModel } from './infrastructure/persistence/models/qualification.model';
import { SequelizeQualificationRepository } from './infrastructure/persistence/repositories/sequelize-qualification.repository';
import { QualificationsController } from './presentation/controllers/qualifications.controller';
import { USER_REPOSITORY } from '../identity/core/application/ports/user-repository.port';
import { IdentityModule } from '../identity/index.module';
import { CacheInvalidatingUseCase } from '../../shared/application/cache/cache-invalidating-use-case';
import { CacheKeyGenerator } from '../../shared/application/cache/cache-key-generator';
import { CachedUseCase } from '../../shared/application/cache/cached-use-case';
import { CacheResource } from '../../shared/application/cache/cache-resource.enum';
import { CACHE_INVALIDATION_SERVICE } from '../../shared/application/ports/cache-invalidation-service.port';
import { CACHE_MANAGER } from '../../shared/application/ports/cache-manager.port';
import { CACHE_POLICY } from '../../shared/application/ports/cache-policy.port';

import type { BarberRepository } from '../barber/core/application/ports/barber-repository.port';
import type { QualificationRepository } from './core/application/ports/qualification-repository.port';
import type { UserRepository } from '../identity/core/application/ports/user-repository.port';
import type { CacheInvalidationService } from '../../shared/application/ports/cache-invalidation-service.port';
import type { CacheManager } from '../../shared/application/ports/cache-manager.port';
import type { CachePolicy } from '../../shared/application/ports/cache-policy.port';

@Module({
  imports: [
    IdentityModule,
    SequelizeModule.forFeature([QualificationModel]),
    forwardRef(() => BarberModule),
  ],
  controllers: [QualificationsController],
  providers: [
    {
      provide: QUALIFICATION_REPOSITORY,
      useClass: SequelizeQualificationRepository,
    },
    {
      provide: CreateQualificationUseCase,
      useFactory: (
        qualificationRepository: QualificationRepository,
        userRepository: UserRepository,
        cacheInvalidationService: CacheInvalidationService,
      ) =>
        new CacheInvalidatingUseCase(
          new CreateQualificationUseCase(
            qualificationRepository,
            userRepository,
          ),
          cacheInvalidationService,
          {
            buildKeys: () => [CacheKeyGenerator.qualifications()],
          },
        ),
      inject: [
        QUALIFICATION_REPOSITORY,
        USER_REPOSITORY,
        CACHE_INVALIDATION_SERVICE,
      ],
    },
    {
      provide: UpdateQualificationUseCase,
      useFactory: (
        qualificationRepository: QualificationRepository,
        userRepository: UserRepository,
        cacheInvalidationService: CacheInvalidationService,
      ) =>
        new CacheInvalidatingUseCase(
          new UpdateQualificationUseCase(
            qualificationRepository,
            userRepository,
          ),
          cacheInvalidationService,
          {
            buildKeys: () => [CacheKeyGenerator.qualifications()],
            // A renamed/redescribed qualification is embedded in every
            // barber's cached response — the exact affected barbers
            // aren't known without a lookup, so the whole list is
            // invalidated; individual GetBarber entries fall back to TTL.
            buildPrefixes: () => [CacheKeyGenerator.barbersListPrefix()],
          },
        ),
      inject: [
        QUALIFICATION_REPOSITORY,
        USER_REPOSITORY,
        CACHE_INVALIDATION_SERVICE,
      ],
    },
    {
      provide: DeleteQualificationUseCase,
      useFactory: (
        qualificationRepository: QualificationRepository,
        barberRepository: BarberRepository,
        userRepository: UserRepository,
        cacheInvalidationService: CacheInvalidationService,
      ) =>
        new CacheInvalidatingUseCase(
          new DeleteQualificationUseCase(
            qualificationRepository,
            barberRepository,
            userRepository,
          ),
          cacheInvalidationService,
          {
            // Deletion is rejected while any barber still holds the
            // qualification, so by the time it succeeds no barber cache
            // can be stale — only the qualifications list needs clearing.
            buildKeys: () => [CacheKeyGenerator.qualifications()],
          },
        ),
      inject: [
        QUALIFICATION_REPOSITORY,
        BARBER_REPOSITORY,
        USER_REPOSITORY,
        CACHE_INVALIDATION_SERVICE,
      ],
    },
    {
      provide: ListQualificationsUseCase,
      useFactory: (
        qualificationRepository: QualificationRepository,
        cacheManager: CacheManager,
        cachePolicy: CachePolicy,
      ) =>
        new CachedUseCase(
          new ListQualificationsUseCase(qualificationRepository),
          cacheManager,
          cachePolicy,
          {
            resource: CacheResource.QUALIFICATIONS,
            buildKey: () => CacheKeyGenerator.qualifications(),
          },
        ),
      inject: [QUALIFICATION_REPOSITORY, CACHE_MANAGER, CACHE_POLICY],
    },
  ],
  exports: [QUALIFICATION_REPOSITORY],
})
export class QualificationModule {}
