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

import type { PasswordHasher } from './core/application/ports/password-hasher.port';
import type { UserRepository } from './core/application/ports/user-repository.port';

@Module({
  controllers: [UsersController],
  providers: [
    {
      provide: RegisterUserUseCase,
      useFactory: (
        userRepository: UserRepository,
        passwordHasher: PasswordHasher,
      ) => new RegisterUserUseCase(userRepository, passwordHasher),
      inject: [USER_REPOSITORY, PASSWORD_HASHER],
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
      useFactory: (userRepository: UserRepository) =>
        new GetUserProfileUseCase(userRepository),
      inject: [USER_REPOSITORY],
    },
    {
      provide: ChangePasswordUseCase,
      useFactory: (
        userRepository: UserRepository,
        passwordHasher: PasswordHasher,
      ) => new ChangePasswordUseCase(userRepository, passwordHasher),
      inject: [USER_REPOSITORY, PASSWORD_HASHER],
    },
    {
      provide: ChangeUserRoleUseCase,
      useFactory: (userRepository: UserRepository) =>
        new ChangeUserRoleUseCase(userRepository),
      inject: [USER_REPOSITORY],
    },
    {
      provide: DeactivateUserUseCase,
      useFactory: (userRepository: UserRepository) =>
        new DeactivateUserUseCase(userRepository),
      inject: [USER_REPOSITORY],
    },
    {
      provide: ActivateUserUseCase,
      useFactory: (userRepository: UserRepository) =>
        new ActivateUserUseCase(userRepository),
      inject: [USER_REPOSITORY],
    },
  ],
})
export class IdentityModule {}
