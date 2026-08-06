import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

import { PASSWORD_HASHER } from '../identity/core/application/ports/password-hasher.port';
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
import { CLOCK } from '../../shared/application/ports/clock.port';
import { EVENT_BUS } from '../../shared/application/ports/event-bus.port';
import { AccountVerificationController } from './presentation/controllers/account-verification.controller';

import type { PasswordHasher } from '../identity/core/application/ports/password-hasher.port';
import type { SessionManager } from './core/application/ports/session-manager.port';
import type { VerificationCodeGenerator } from './core/application/ports/verification-code-generator.port';
import type { VerificationCodeRepository } from './core/application/ports/verification-code-repository.port';
import type { Clock } from '../../shared/application/ports/clock.port';
import type { EventBus } from '../../shared/application/ports/event-bus.port';

@Module({
  imports: [SequelizeModule.forFeature([VerificationCodeModel])],
  controllers: [AccountVerificationController],
  providers: [
    {
      provide: VERIFICATION_CODE_REPOSITORY,
      useClass: SequelizeVerificationCodeRepository,
    },
    {
      provide: GenerateVerificationCodeUseCase,
      useFactory: (
        verificationCodeRepository: VerificationCodeRepository,
        verificationCodeGenerator: VerificationCodeGenerator,
        passwordHasher: PasswordHasher,
        clock: Clock,
        eventBus: EventBus,
      ) =>
        new GenerateVerificationCodeUseCase(
          verificationCodeRepository,
          verificationCodeGenerator,
          passwordHasher,
          clock,
          eventBus,
        ),
      inject: [
        VERIFICATION_CODE_REPOSITORY,
        VERIFICATION_CODE_GENERATOR,
        PASSWORD_HASHER,
        CLOCK,
        EVENT_BUS,
      ],
    },
    {
      provide: ResendVerificationCodeUseCase,
      useFactory: (
        generateVerificationCodeUseCase: GenerateVerificationCodeUseCase,
      ) => new ResendVerificationCodeUseCase(generateVerificationCodeUseCase),
      inject: [GenerateVerificationCodeUseCase],
    },
    {
      provide: ValidateVerificationCodeUseCase,
      useFactory: (
        verificationCodeRepository: VerificationCodeRepository,
        passwordHasher: PasswordHasher,
        clock: Clock,
        eventBus: EventBus,
      ) =>
        new ValidateVerificationCodeUseCase(
          verificationCodeRepository,
          passwordHasher,
          clock,
          eventBus,
        ),
      inject: [VERIFICATION_CODE_REPOSITORY, PASSWORD_HASHER, CLOCK, EVENT_BUS],
    },
    {
      provide: InvalidateExpiredVerificationCodesUseCase,
      useFactory: (
        verificationCodeRepository: VerificationCodeRepository,
        clock: Clock,
      ) =>
        new InvalidateExpiredVerificationCodesUseCase(
          verificationCodeRepository,
          clock,
        ),
      inject: [VERIFICATION_CODE_REPOSITORY, CLOCK],
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
  ],
})
export class AccountVerificationModule {}
