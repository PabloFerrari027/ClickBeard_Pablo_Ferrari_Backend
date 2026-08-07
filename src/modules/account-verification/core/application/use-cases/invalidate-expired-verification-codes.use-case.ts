import {
  InvalidateExpiredVerificationCodesInputDto,
  InvalidateExpiredVerificationCodesOutputDto,
} from '../dtos/invalidate-expired-verification-codes.dto';
import { VerificationCodeRepository } from '../ports/verification-code-repository.port';
import { UseCase } from '../../../../../shared/application/use-case';

/**
 * Maintenance use case for a future scheduler: sweeps codes that expired
 * without being consumed and marks them invalidated so they can no
 * longer be matched by findActiveByUserId.
 */
export class InvalidateExpiredVerificationCodesUseCase implements UseCase<
  InvalidateExpiredVerificationCodesInputDto,
  InvalidateExpiredVerificationCodesOutputDto
> {
  constructor(
    private readonly verificationCodeRepository: VerificationCodeRepository,
  ) {}

  async execute(): Promise<InvalidateExpiredVerificationCodesOutputDto> {
    const now = new Date();
    const expiredCodes =
      await this.verificationCodeRepository.findExpiredActive(now);

    for (const code of expiredCodes) {
      code.invalidate(now);
      await this.verificationCodeRepository.save(code);
    }

    return { invalidatedCount: expiredCodes.length };
  }
}
