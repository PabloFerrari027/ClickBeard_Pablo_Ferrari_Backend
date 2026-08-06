import { VerificationNotCompletedError } from '../../domain/errors/verification-not-completed.error';
import {
  CompleteAuthenticationInputDto,
  CompleteAuthenticationOutputDto,
} from '../dtos/complete-authentication.dto';
import { VerificationCodeRepository } from '../ports/verification-code-repository.port';
import { SessionManager } from '../ports/session-manager.port';
import { UseCase } from '../../../../../shared/application/use-case';

/**
 * Enforces "the session is only created after the code is validated" as
 * a real domain guard: it re-checks the latest code's own state rather
 * than trusting that ValidateVerificationCodeUseCase was called first.
 */
export class CompleteAuthenticationUseCase implements UseCase<
  CompleteAuthenticationInputDto,
  CompleteAuthenticationOutputDto
> {
  constructor(
    private readonly verificationCodeRepository: VerificationCodeRepository,
    private readonly sessionManager: SessionManager,
  ) {}

  async execute(
    input: CompleteAuthenticationInputDto,
  ): Promise<CompleteAuthenticationOutputDto> {
    const latestCode = await this.verificationCodeRepository.findLatestByUserId(
      input.userId,
    );

    if (!latestCode || !latestCode.isConsumed()) {
      throw new VerificationNotCompletedError();
    }

    return this.sessionManager.createSession(input.userId);
  }
}
