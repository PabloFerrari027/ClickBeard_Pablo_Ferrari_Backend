import { PasswordHasher } from '../../../../identity/core/application/ports/password-hasher.port';
import { InvalidVerificationCodeError } from '../../domain/errors/invalid-verification-code.error';
import { VerificationCodeAttemptsExceededError } from '../../domain/errors/verification-code-attempts-exceeded.error';
import { VerificationCodeExpiredError } from '../../domain/errors/verification-code-expired.error';
import { VerificationCodeNotFoundError } from '../../domain/errors/verification-code-not-found.error';
import { VerificationFailedEvent } from '../../domain/events/verification-failed.event';
import { VerificationSucceededEvent } from '../../domain/events/verification-succeeded.event';
import {
  ValidateVerificationCodeInputDto,
  ValidateVerificationCodeOutputDto,
} from '../dtos/validate-verification-code.dto';
import { VerificationCodeRepository } from '../ports/verification-code-repository.port';
import { EventBus } from '../../../../../shared/application/ports/event-bus.port';
import { UseCase } from '../../../../../shared/application/use-case';

export class ValidateVerificationCodeUseCase implements UseCase<
  ValidateVerificationCodeInputDto,
  ValidateVerificationCodeOutputDto
> {
  constructor(
    private readonly verificationCodeRepository: VerificationCodeRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly eventBus: EventBus,
  ) {}

  async execute(
    input: ValidateVerificationCodeInputDto,
  ): Promise<ValidateVerificationCodeOutputDto> {
    const now = new Date();

    const code = await this.verificationCodeRepository.findActiveByUserId(
      input.userId,
    );

    if (!code) {
      await this.publishFailure(input.userId, 'not_found', now);
      throw new VerificationCodeNotFoundError();
    }

    if (code.hasExceededAttempts()) {
      await this.publishFailure(input.userId, 'attempts_exceeded', now);
      throw new VerificationCodeAttemptsExceededError();
    }

    if (code.isExpired(now)) {
      await this.publishFailure(input.userId, 'expired', now);
      throw new VerificationCodeExpiredError();
    }

    const isCodeValid = await this.passwordHasher.compare(
      input.code,
      code.getCodeHash(),
    );

    if (!isCodeValid) {
      code.recordFailedAttempt();
      await this.verificationCodeRepository.save(code);
      await this.publishFailure(input.userId, 'invalid_code', now);
      throw new InvalidVerificationCodeError();
    }

    code.consume(now);
    await this.verificationCodeRepository.save(code);

    await this.eventBus.publish(
      new VerificationSucceededEvent({ userId: input.userId }, now),
    );

    return { verified: true };
  }

  private async publishFailure(
    userId: string,
    reason: string,
    now: Date,
  ): Promise<void> {
    await this.eventBus.publish(
      new VerificationFailedEvent({ userId, reason }, now),
    );
  }
}
