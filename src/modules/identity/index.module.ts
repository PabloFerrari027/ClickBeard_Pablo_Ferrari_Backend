import { forwardRef, Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

import { PASSWORD_HASHER } from './core/application/ports/password-hasher.port';
import { AuthModule } from '../auth/index.module';
import { USER_REPOSITORY } from './core/application/ports/user-repository.port';
import { ActivateUserUseCase } from './core/application/use-cases/activate-user.use-case';
import { AuthenticateUserUseCase } from './core/application/use-cases/authenticate-user.use-case';
import { ChangePasswordUseCase } from './core/application/use-cases/change-password.use-case';
import { ChangeUserRoleUseCase } from './core/application/use-cases/change-user-role.use-case';
import { DeactivateUserUseCase } from './core/application/use-cases/deactivate-user.use-case';
import { GetUserProfileUseCase } from './core/application/use-cases/get-user-profile.use-case';
import { ListUsersUseCase } from './core/application/use-cases/list-users.use-case';
import { RegisterUserUseCase } from './core/application/use-cases/register-user.use-case';
import { UpdateUserProfileUseCase } from './core/application/use-cases/update-user-profile.use-case';
import { UserModel } from './infrastructure/persistence/models/user.model';
import { SequelizeUserRepository } from './infrastructure/persistence/repositories/sequelize-user.repository';
import { BcryptPasswordHasher } from './infrastructure/security/bcrypt-password-hasher';
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

/**
 * Imports `AuthModule` (via `forwardRef`, since `AuthModule` imports
 * this module back for `USER_REPOSITORY`/`PASSWORD_HASHER`) purely so
 * `UsersController`'s `@Auth()` guard can resolve `TOKEN_PROVIDER` —
 * Identity's own use cases never depend on Auth.
 */
@Module({
  imports: [
    SequelizeModule.forFeature([UserModel]),
    forwardRef(() => AuthModule),
  ],
  controllers: [UsersController],
  providers: [
    { provide: USER_REPOSITORY, useClass: SequelizeUserRepository },
    { provide: PASSWORD_HASHER, useClass: BcryptPasswordHasher },
    {
      provide: RegisterUserUseCase,
      useFactory: (
        userRepository: UserRepository,
        passwordHasher: PasswordHasher,
        eventBus: EventBus,
        cacheInvalidationService: CacheInvalidationService,
      ) =>
        new CacheInvalidatingUseCase(
          new RegisterUserUseCase(userRepository, passwordHasher, eventBus),
          cacheInvalidationService,
          {
            buildPrefixes: () => [CacheKeyGenerator.usersListPrefix()],
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
      provide: ListUsersUseCase,
      useFactory: (
        userRepository: UserRepository,
        cacheManager: CacheManager,
        cachePolicy: CachePolicy,
      ) =>
        new CachedUseCase(
          new ListUsersUseCase(userRepository),
          cacheManager,
          cachePolicy,
          {
            resource: CacheResource.USERS_LIST,
            // Mirrors ListUsersUseCase's own DEFAULT_PAGE, so an
            // omitted page and an explicit page=1 share one cache entry.
            buildKey: (input) => CacheKeyGenerator.usersList(input.page ?? 1),
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
      provide: UpdateUserProfileUseCase,
      useFactory: (
        userRepository: UserRepository,
        cacheInvalidationService: CacheInvalidationService,
      ) =>
        new CacheInvalidatingUseCase(
          new UpdateUserProfileUseCase(userRepository),
          cacheInvalidationService,
          {
            buildKeys: (input) => [CacheKeyGenerator.userProfile(input.userId)],
            buildPrefixes: () => [CacheKeyGenerator.usersListPrefix()],
          },
        ),
      inject: [USER_REPOSITORY, CACHE_INVALIDATION_SERVICE],
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
            buildPrefixes: () => [CacheKeyGenerator.usersListPrefix()],
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
            buildPrefixes: () => [CacheKeyGenerator.usersListPrefix()],
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
            buildPrefixes: () => [CacheKeyGenerator.usersListPrefix()],
          },
        ),
      inject: [USER_REPOSITORY, CACHE_INVALIDATION_SERVICE],
    },
  ],
  exports: [USER_REPOSITORY, PASSWORD_HASHER],
})
export class IdentityModule {}
