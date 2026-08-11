import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

import { PASSWORD_HASHER } from '../identity/core/application/ports/password-hasher.port';
import { USER_REPOSITORY } from '../identity/core/application/ports/user-repository.port';
import { CompleteAuthenticationUseCase } from './core/application/use-cases/complete-authentication.use-case';
import { GenerateVerificationCodeUseCase } from './core/application/use-cases/generate-verification-code.use-case';
import { InvalidateExpiredVerificationCodesUseCase } from './core/application/use-cases/invalidate-expired-verification-codes.use-case';
import { ResendVerificationCodeUseCase } from './core/application/use-cases/resend-verification-code.use-case';
import { ValidateVerificationCodeUseCase } from './core/application/use-cases/validate-verification-code.use-case';
import { SESSION_MANAGER } from './core/application/ports/session-manager.port';
import { VERIFICATION_CODE_GENERATOR } from './core/application/ports/verification-code-generator.port';
import { VERIFICATION_CODE_REPOSITORY } from './core/application/ports/verification-code-repository.port';
import { VerificationCodeModel } from './infrastructure/persistence/models/verification-code.model';
import { SequelizeVerificationCodeRepository } from './infrastructure/persistence/repositories/sequelize-verification-code.repository';
import { VerificationCodeRequestConsumer } from './infrastructure/messaging/verification-code-request.consumer';
import { ExpiredCodesSweepScheduler } from './infrastructure/scheduling/expired-codes-sweep.scheduler';
import { AuthSessionManager } from './infrastructure/security/auth-session-manager';
import { RandomVerificationCodeGenerator } from './infrastructure/security/random-verification-code-generator';
import { AuthModule } from '../auth/index.module';
import { IdentityModule } from '../identity/index.module';
import { RedisConfigModule } from '../../shared/config/redis-config.module';
import { EVENT_BUS } from '../../shared/application/ports/event-bus.port';
import { AccountVerificationController } from './presentation/controllers/account-verification.controller';

import type { PasswordHasher } from '../identity/core/application/ports/password-hasher.port';
import type { UserRepository } from '../identity/core/application/ports/user-repository.port';
import type { SessionManager } from './core/application/ports/session-manager.port';
import type { VerificationCodeGenerator } from './core/application/ports/verification-code-generator.port';
import type { VerificationCodeRepository } from './core/application/ports/verification-code-repository.port';
import type { EventBus } from '../../shared/application/ports/event-bus.port';

@Module({
  imports: [
    SequelizeModule.forFeature([VerificationCodeModel]),
    IdentityModule,
    AuthModule,
    RedisConfigModule,
  ],
  controllers: [AccountVerificationController],
  providers: [
    {
      provide: VERIFICATION_CODE_REPOSITORY,
      useClass: SequelizeVerificationCodeRepository,
    },
    {
      provide: VERIFICATION_CODE_GENERATOR,
      useClass: RandomVerificationCodeGenerator,
    },
    { provide: SESSION_MANAGER, useClass: AuthSessionManager },
    {
      provide: GenerateVerificationCodeUseCase,
      useFactory: (
        verificationCodeRepository: VerificationCodeRepository,
        verificationCodeGenerator: VerificationCodeGenerator,
        passwordHasher: PasswordHasher,
        eventBus: EventBus,
      ) =>
        new GenerateVerificationCodeUseCase(
          verificationCodeRepository,
          verificationCodeGenerator,
          passwordHasher,
          eventBus,
        ),
      inject: [
        VERIFICATION_CODE_REPOSITORY,
        VERIFICATION_CODE_GENERATOR,
        PASSWORD_HASHER,
        EVENT_BUS,
      ],
    },
    {
      provide: ResendVerificationCodeUseCase,
      useFactory: (
        userRepository: UserRepository,
        generateVerificationCodeUseCase: GenerateVerificationCodeUseCase,
      ) =>
        new ResendVerificationCodeUseCase(
          userRepository,
          generateVerificationCodeUseCase,
        ),
      inject: [USER_REPOSITORY, GenerateVerificationCodeUseCase],
    },
    {
      provide: ValidateVerificationCodeUseCase,
      useFactory: (
        verificationCodeRepository: VerificationCodeRepository,
        passwordHasher: PasswordHasher,
        eventBus: EventBus,
      ) =>
        new ValidateVerificationCodeUseCase(
          verificationCodeRepository,
          passwordHasher,
          eventBus,
        ),
      inject: [VERIFICATION_CODE_REPOSITORY, PASSWORD_HASHER, EVENT_BUS],
    },
    {
      provide: InvalidateExpiredVerificationCodesUseCase,
      useFactory: (verificationCodeRepository: VerificationCodeRepository) =>
        new InvalidateExpiredVerificationCodesUseCase(
          verificationCodeRepository,
        ),
      inject: [VERIFICATION_CODE_REPOSITORY],
    },
    {
      provide: CompleteAuthenticationUseCase,
      useFactory: (
        verificationCodeRepository: VerificationCodeRepository,
        sessionManager: SessionManager,
      ) =>
        new CompleteAuthenticationUseCase(
          verificationCodeRepository,
          sessionManager,
        ),
      inject: [VERIFICATION_CODE_REPOSITORY, SESSION_MANAGER],
    },
    VerificationCodeRequestConsumer,
    ExpiredCodesSweepScheduler,
  ],
})
export class AccountVerificationModule {}
