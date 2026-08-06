import { Module } from '@nestjs/common';

import { PASSWORD_HASHER } from '../identity/core/application/ports/password-hasher.port';
import { LoginUseCase } from './core/application/use-cases/login.use-case';
import { LogoutUseCase } from './core/application/use-cases/logout.use-case';
import { RefreshTokenUseCase } from './core/application/use-cases/refresh-token.use-case';
import { REFRESH_TOKEN_REPOSITORY } from './core/application/ports/refresh-token-repository.port';
import { TOKEN_PROVIDER } from './core/application/ports/token-provider.port';
import { USER_DIRECTORY } from './core/application/ports/user-directory.port';
import { EVENT_BUS } from '../../shared/application/ports/event-bus.port';

import type { PasswordHasher } from '../identity/core/application/ports/password-hasher.port';
import type { RefreshTokenRepository } from './core/application/ports/refresh-token-repository.port';
import type { TokenProvider } from './core/application/ports/token-provider.port';
import type { UserDirectory } from './core/application/ports/user-directory.port';
import type { EventBus } from '../../shared/application/ports/event-bus.port';

@Module({
  providers: [
    {
      provide: LoginUseCase,
      useFactory: (
        userDirectory: UserDirectory,
        passwordHasher: PasswordHasher,
        eventBus: EventBus,
      ) => new LoginUseCase(userDirectory, passwordHasher, eventBus),
      inject: [USER_DIRECTORY, PASSWORD_HASHER, EVENT_BUS],
    },
    {
      provide: RefreshTokenUseCase,
      useFactory: (
        refreshTokenRepository: RefreshTokenRepository,
        tokenProvider: TokenProvider,
        userDirectory: UserDirectory,
      ) =>
        new RefreshTokenUseCase(
          refreshTokenRepository,
          tokenProvider,
          userDirectory,
        ),
      inject: [REFRESH_TOKEN_REPOSITORY, TOKEN_PROVIDER, USER_DIRECTORY],
    },
    {
      provide: LogoutUseCase,
      useFactory: (
        refreshTokenRepository: RefreshTokenRepository,
        tokenProvider: TokenProvider,
      ) => new LogoutUseCase(refreshTokenRepository, tokenProvider),
      inject: [REFRESH_TOKEN_REPOSITORY, TOKEN_PROVIDER],
    },
  ],
})
export class AuthModule {}
