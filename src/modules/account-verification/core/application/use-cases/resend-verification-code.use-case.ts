import { UserNotFoundError } from '../../../../identity/core/domain/errors/user-not-found.error';
import { UserRepository } from '../../../../identity/core/application/ports/user-repository.port';
import {
  ResendVerificationCodeInputDto,
  ResendVerificationCodeOutputDto,
} from '../dtos/resend-verification-code.dto';
import { GenerateVerificationCodeUseCase } from './generate-verification-code.use-case';
import { UseCase } from '../../../../../shared/application/use-case';

/**
 * A resend is, by business rule, indistinguishable from generating a new
 * code: only one code may be active per user, and generating one always
 * invalidates whatever was active before. This use case exists as its
 * own step (per the requirements) but delegates to
 * GenerateVerificationCodeUseCase rather than duplicating that logic.
 *
 * The recipient email/name are always resolved from the user record,
 * never trusted from the caller: this endpoint is unauthenticated (a
 * user isn't logged in yet while verifying), so accepting an
 * attacker-supplied email here would let anyone who learns a victim's
 * userId redirect their verification code to an address they control.
 */
export class ResendVerificationCodeUseCase implements UseCase<
  ResendVerificationCodeInputDto,
  ResendVerificationCodeOutputDto
> {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly generateVerificationCodeUseCase: GenerateVerificationCodeUseCase,
  ) {}

  async execute(
    input: ResendVerificationCodeInputDto,
  ): Promise<ResendVerificationCodeOutputDto> {
    const user = await this.userRepository.findById(input.userId);

    if (!user) {
      throw new UserNotFoundError();
    }

    return this.generateVerificationCodeUseCase.execute({
      userId: user.getId(),
      email: user.getEmail().getValue(),
      name: user.getName(),
    });
  }
}
