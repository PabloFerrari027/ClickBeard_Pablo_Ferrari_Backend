import { Module } from '@nestjs/common';

import { PASSWORD_HASHER } from './core/application/ports/password-hasher.port';
import { USER_REPOSITORY } from './core/application/ports/user-repository.port';
import { ActivateUserUseCase } from './core/application/use-cases/activate-user.use-case';
import { AuthenticateUserUseCase } from './core/application/use-cases/authenticate-user.use-case';
import { ChangePasswordUseCase } from './core/application/use-cases/change-password.use-case';
import { ChangeUserRoleUseCase } from './core/application/use-cases/change-user-role.use-case';
import { DeactivateUserUseCase } from './core/application/use-cases/deactivate-user.use-case';
import { GetUserProfileUseCase } from './core/application/use-cases/get-user-profile.use-case';
import { RegisterUserUseCase } from './core/application/use-cases/register-user.use-case';
import { UsersController } from './presentation/controllers/users.controller';
import { CacheInvalidatingUseCase } from '../../shared/application/cache/cache-invalidating-use-case';
import { CacheKeyGenerator } from '../../shared/application/cache/cache-key-generator';
import { CachedUseCase } from '../../shared/application/cache/cached-use-case';
import { CacheResource } from '../../shared/application/cache/cache-resource.enum';
import { CACHE_INVALIDATION_SERVICE } from '../../shared/application/ports/cache-invalidation-service.port';
import { CACHE_MANAGER } from '../../shared/application/ports/cache-manager.port';
import { CACHE_POLICY } from '../../shared/application/ports/cache-policy.port';
import { EVENT_BUS } from '../../shared/application/ports/event-bus.port';

import type { PasswordHasher } from './core/application/ports/password-hasher.port';
import type { UserRepository } from './core/application/ports/user-repository.port';
import type { CacheInvalidationService } from '../../shared/application/ports/cache-invalidation-service.port';
import type { CacheManager } from '../../shared/application/ports/cache-manager.port';
import type { CachePolicy } from '../../shared/application/ports/cache-policy.port';
import type { EventBus } from '../../shared/application/ports/event-bus.port';

@Module({
  controllers: [UsersController],
  providers: [
    {
      provide: RegisterUserUseCase,
      useFactory: (
        userRepository: UserRepository,
        passwordHasher: PasswordHasher,
        eventBus: EventBus,
      ) => new RegisterUserUseCase(userRepository, passwordHasher, eventBus),
      inject: [USER_REPOSITORY, PASSWORD_HASHER, EVENT_BUS],
    },
    {
      provide: AuthenticateUserUseCase,
      useFactory: (
        userRepository: UserRepository,
        passwordHasher: PasswordHasher,
      ) => new AuthenticateUserUseCase(userRepository, passwordHasher),
      inject: [USER_REPOSITORY, PASSWORD_HASHER],
    },
    {
      provide: GetUserProfileUseCase,
      useFactory: (
        userRepository: UserRepository,
        cacheManager: CacheManager,
        cachePolicy: CachePolicy,
      ) =>
        new CachedUseCase(
          new GetUserProfileUseCase(userRepository),
          cacheManager,
          cachePolicy,
          {
            resource: CacheResource.USER_PROFILE,
            buildKey: (input) => CacheKeyGenerator.userProfile(input.userId),
          },
        ),
      inject: [USER_REPOSITORY, CACHE_MANAGER, CACHE_POLICY],
    },
    {
      provide: ChangePasswordUseCase,
      useFactory: (
        userRepository: UserRepository,
        passwordHasher: PasswordHasher,
        eventBus: EventBus,
        cacheInvalidationService: CacheInvalidationService,
      ) =>
        new CacheInvalidatingUseCase(
          new ChangePasswordUseCase(userRepository, passwordHasher, eventBus),
          cacheInvalidationService,
          {
            buildKeys: (input) => [CacheKeyGenerator.userProfile(input.userId)],
          },
        ),
      inject: [
        USER_REPOSITORY,
        PASSWORD_HASHER,
        EVENT_BUS,
        CACHE_INVALIDATION_SERVICE,
      ],
    },
    {
      provide: ChangeUserRoleUseCase,
      useFactory: (
        userRepository: UserRepository,
        cacheInvalidationService: CacheInvalidationService,
      ) =>
        new CacheInvalidatingUseCase(
          new ChangeUserRoleUseCase(userRepository),
          cacheInvalidationService,
          {
            buildKeys: (input) => [CacheKeyGenerator.userProfile(input.userId)],
          },
        ),
      inject: [USER_REPOSITORY, CACHE_INVALIDATION_SERVICE],
    },
    {
      provide: DeactivateUserUseCase,
      useFactory: (
        userRepository: UserRepository,
        cacheInvalidationService: CacheInvalidationService,
      ) =>
        new CacheInvalidatingUseCase(
          new DeactivateUserUseCase(userRepository),
          cacheInvalidationService,
          {
            buildKeys: (input) => [CacheKeyGenerator.userProfile(input.userId)],
          },
        ),
      inject: [USER_REPOSITORY, CACHE_INVALIDATION_SERVICE],
    },
    {
      provide: ActivateUserUseCase,
      useFactory: (
        userRepository: UserRepository,
        cacheInvalidationService: CacheInvalidationService,
      ) =>
        new CacheInvalidatingUseCase(
          new ActivateUserUseCase(userRepository),
          cacheInvalidationService,
          {
            buildKeys: (input) => [CacheKeyGenerator.userProfile(input.userId)],
          },
        ),
      inject: [USER_REPOSITORY, CACHE_INVALIDATION_SERVICE],
    },
  ],
})
export class IdentityModule {}
