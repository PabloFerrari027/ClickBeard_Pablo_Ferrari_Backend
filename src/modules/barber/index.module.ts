import { forwardRef, Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

import { QUALIFICATION_REPOSITORY } from '../qualification/core/application/ports/qualification-repository.port';
import { QualificationModule } from '../qualification/index.module';
import { BARBER_UNAVAILABILITY_REPOSITORY } from './core/application/ports/barber-unavailability-repository.port';
import { BARBER_REPOSITORY } from './core/application/ports/barber-repository.port';
import { AddQualificationToBarberUseCase } from './core/application/use-cases/add-qualification-to-barber.use-case';
import { CreateBarberUnavailabilityUseCase } from './core/application/use-cases/create-barber-unavailability.use-case';
import { CreateBarberUseCase } from './core/application/use-cases/create-barber.use-case';
import { DeactivateBarberUseCase } from './core/application/use-cases/deactivate-barber.use-case';
import { DeleteBarberUnavailabilityUseCase } from './core/application/use-cases/delete-barber-unavailability.use-case';
import { GetBarberUseCase } from './core/application/use-cases/get-barber.use-case';
import { ListBarberUnavailabilitiesUseCase } from './core/application/use-cases/list-barber-unavailabilities.use-case';
import { ListBarbersUseCase } from './core/application/use-cases/list-barbers.use-case';
import { RemoveQualificationFromBarberUseCase } from './core/application/use-cases/remove-qualification-from-barber.use-case';
import { UpdateBarberUseCase } from './core/application/use-cases/update-barber.use-case';
import { UserRoleChangedConsumer } from './infrastructure/messaging/user-role-changed.consumer';
import { BarberUnavailabilityModel } from './infrastructure/persistence/models/barber-unavailability.model';
import { BarberQualificationModel } from './infrastructure/persistence/models/barber-qualification.model';
import { BarberModel } from './infrastructure/persistence/models/barber.model';
import { SequelizeBarberUnavailabilityRepository } from './infrastructure/persistence/repositories/sequelize-barber-unavailability.repository';
import { SequelizeBarberRepository } from './infrastructure/persistence/repositories/sequelize-barber.repository';
import { BarbersController } from './presentation/controllers/barbers.controller';
import { USER_REPOSITORY } from '../identity/core/application/ports/user-repository.port';
import { IdentityModule } from '../identity/index.module';
import { AuthModule } from '../auth/index.module';
import { CacheInvalidatingUseCase } from '../../shared/application/cache/cache-invalidating-use-case';
import { CacheKeyGenerator } from '../../shared/application/cache/cache-key-generator';
import { CachedUseCase } from '../../shared/application/cache/cached-use-case';
import { CacheResource } from '../../shared/application/cache/cache-resource.enum';
import { CACHE_INVALIDATION_SERVICE } from '../../shared/application/ports/cache-invalidation-service.port';
import { CACHE_MANAGER } from '../../shared/application/ports/cache-manager.port';
import { CACHE_POLICY } from '../../shared/application/ports/cache-policy.port';
import { EVENT_BUS } from '../../shared/application/ports/event-bus.port';

import type { QualificationRepository } from '../qualification/core/application/ports/qualification-repository.port';
import type { BarberUnavailabilityRepository } from './core/application/ports/barber-unavailability-repository.port';
import type { BarberRepository } from './core/application/ports/barber-repository.port';
import type { UserRepository } from '../identity/core/application/ports/user-repository.port';
import type { CacheInvalidationService } from '../../shared/application/ports/cache-invalidation-service.port';
import type { CacheManager } from '../../shared/application/ports/cache-manager.port';
import type { CachePolicy } from '../../shared/application/ports/cache-policy.port';
import type { EventBus } from '../../shared/application/ports/event-bus.port';

@Module({
  imports: [
    IdentityModule,
    AuthModule,
    SequelizeModule.forFeature([
      BarberModel,
      BarberQualificationModel,
      BarberUnavailabilityModel,
    ]),
    forwardRef(() => QualificationModule),
  ],
  controllers: [BarbersController],
  providers: [
    { provide: BARBER_REPOSITORY, useClass: SequelizeBarberRepository },
    {
      provide: BARBER_UNAVAILABILITY_REPOSITORY,
      useClass: SequelizeBarberUnavailabilityRepository,
    },
    {
      provide: CreateBarberUseCase,
      useFactory: (
        barberRepository: BarberRepository,
        qualificationRepository: QualificationRepository,
        userRepository: UserRepository,
        cacheInvalidationService: CacheInvalidationService,
      ) =>
        new CacheInvalidatingUseCase(
          new CreateBarberUseCase(
            barberRepository,
            qualificationRepository,
            userRepository,
          ),
          cacheInvalidationService,
          {
            buildPrefixes: () => [CacheKeyGenerator.barbersListPrefix()],
          },
        ),
      inject: [
        BARBER_REPOSITORY,
        QUALIFICATION_REPOSITORY,
        USER_REPOSITORY,
        CACHE_INVALIDATION_SERVICE,
      ],
    },
    {
      provide: UpdateBarberUseCase,
      useFactory: (
        barberRepository: BarberRepository,
        qualificationRepository: QualificationRepository,
        cacheInvalidationService: CacheInvalidationService,
      ) =>
        new CacheInvalidatingUseCase(
          new UpdateBarberUseCase(barberRepository, qualificationRepository),
          cacheInvalidationService,
          {
            buildKeys: (input) => [CacheKeyGenerator.barber(input.barberId)],
            buildPrefixes: () => [CacheKeyGenerator.barbersListPrefix()],
          },
        ),
      inject: [
        BARBER_REPOSITORY,
        QUALIFICATION_REPOSITORY,
        CACHE_INVALIDATION_SERVICE,
      ],
    },
    {
      provide: GetBarberUseCase,
      useFactory: (
        barberRepository: BarberRepository,
        qualificationRepository: QualificationRepository,
        cacheManager: CacheManager,
        cachePolicy: CachePolicy,
      ) =>
        new CachedUseCase(
          new GetBarberUseCase(barberRepository, qualificationRepository),
          cacheManager,
          cachePolicy,
          {
            resource: CacheResource.BARBER,
            buildKey: (input) => CacheKeyGenerator.barber(input.barberId),
          },
        ),
      inject: [
        BARBER_REPOSITORY,
        QUALIFICATION_REPOSITORY,
        CACHE_MANAGER,
        CACHE_POLICY,
      ],
    },
    {
      provide: ListBarbersUseCase,
      useFactory: (
        barberRepository: BarberRepository,
        qualificationRepository: QualificationRepository,
        cacheManager: CacheManager,
        cachePolicy: CachePolicy,
      ) =>
        new CachedUseCase(
          new ListBarbersUseCase(barberRepository, qualificationRepository),
          cacheManager,
          cachePolicy,
          {
            resource: CacheResource.BARBERS_LIST,
            // Mirrors ListBarbersUseCase's own DEFAULT_PAGE, so an
            // omitted page and an explicit page=1 share one cache entry.
            buildKey: (input) => CacheKeyGenerator.barbersList(input.page ?? 1),
          },
        ),
      inject: [
        BARBER_REPOSITORY,
        QUALIFICATION_REPOSITORY,
        CACHE_MANAGER,
        CACHE_POLICY,
      ],
    },
    {
      provide: AddQualificationToBarberUseCase,
      useFactory: (
        barberRepository: BarberRepository,
        qualificationRepository: QualificationRepository,
        userRepository: UserRepository,
        cacheInvalidationService: CacheInvalidationService,
      ) =>
        new CacheInvalidatingUseCase(
          new AddQualificationToBarberUseCase(
            barberRepository,
            qualificationRepository,
            userRepository,
          ),
          cacheInvalidationService,
          {
            buildKeys: (input) => [CacheKeyGenerator.barber(input.barberId)],
            buildPrefixes: () => [CacheKeyGenerator.barbersListPrefix()],
          },
        ),
      inject: [
        BARBER_REPOSITORY,
        QUALIFICATION_REPOSITORY,
        USER_REPOSITORY,
        CACHE_INVALIDATION_SERVICE,
      ],
    },
    {
      provide: RemoveQualificationFromBarberUseCase,
      useFactory: (
        barberRepository: BarberRepository,
        qualificationRepository: QualificationRepository,
        userRepository: UserRepository,
        cacheInvalidationService: CacheInvalidationService,
      ) =>
        new CacheInvalidatingUseCase(
          new RemoveQualificationFromBarberUseCase(
            barberRepository,
            qualificationRepository,
            userRepository,
          ),
          cacheInvalidationService,
          {
            buildKeys: (input) => [CacheKeyGenerator.barber(input.barberId)],
            buildPrefixes: () => [CacheKeyGenerator.barbersListPrefix()],
          },
        ),
      inject: [
        BARBER_REPOSITORY,
        QUALIFICATION_REPOSITORY,
        USER_REPOSITORY,
        CACHE_INVALIDATION_SERVICE,
      ],
    },
    {
      provide: CreateBarberUnavailabilityUseCase,
      useFactory: (
        barberRepository: BarberRepository,
        unavailabilityRepository: BarberUnavailabilityRepository,
        userRepository: UserRepository,
        eventBus: EventBus,
        cacheInvalidationService: CacheInvalidationService,
      ) =>
        new CacheInvalidatingUseCase(
          new CreateBarberUnavailabilityUseCase(
            barberRepository,
            unavailabilityRepository,
            userRepository,
            eventBus,
          ),
          cacheInvalidationService,
          {
            // A new unavailability period can block slots on any date it
            // spans, so every date's time-slots cache for this barber is
            // invalidated, not just one day's.
            buildPrefixes: (input) => [
              CacheKeyGenerator.barberAllTimeSlotsPrefix(input.barberId),
            ],
          },
        ),
      inject: [
        BARBER_REPOSITORY,
        BARBER_UNAVAILABILITY_REPOSITORY,
        USER_REPOSITORY,
        EVENT_BUS,
        CACHE_INVALIDATION_SERVICE,
      ],
    },
    {
      provide: ListBarberUnavailabilitiesUseCase,
      useFactory: (
        barberRepository: BarberRepository,
        unavailabilityRepository: BarberUnavailabilityRepository,
        userRepository: UserRepository,
      ) =>
        new ListBarberUnavailabilitiesUseCase(
          barberRepository,
          unavailabilityRepository,
          userRepository,
        ),
      inject: [
        BARBER_REPOSITORY,
        BARBER_UNAVAILABILITY_REPOSITORY,
        USER_REPOSITORY,
      ],
    },
    {
      provide: DeleteBarberUnavailabilityUseCase,
      useFactory: (
        unavailabilityRepository: BarberUnavailabilityRepository,
        userRepository: UserRepository,
        cacheInvalidationService: CacheInvalidationService,
      ) =>
        new CacheInvalidatingUseCase(
          new DeleteBarberUnavailabilityUseCase(
            unavailabilityRepository,
            userRepository,
          ),
          cacheInvalidationService,
          {
            buildPrefixes: (input) => [
              CacheKeyGenerator.barberAllTimeSlotsPrefix(input.barberId),
            ],
          },
        ),
      inject: [
        BARBER_UNAVAILABILITY_REPOSITORY,
        USER_REPOSITORY,
        CACHE_INVALIDATION_SERVICE,
      ],
    },
    {
      provide: DeactivateBarberUseCase,
      useFactory: (
        barberRepository: BarberRepository,
        cacheInvalidationService: CacheInvalidationService,
      ) =>
        new CacheInvalidatingUseCase(
          new DeactivateBarberUseCase(barberRepository),
          cacheInvalidationService,
          {
            buildKeys: (input) => [CacheKeyGenerator.barber(input.barberId)],
            buildPrefixes: () => [CacheKeyGenerator.barbersListPrefix()],
          },
        ),
      inject: [BARBER_REPOSITORY, CACHE_INVALIDATION_SERVICE],
    },
    UserRoleChangedConsumer,
  ],
  exports: [BARBER_REPOSITORY],
})
export class BarberModule {}
