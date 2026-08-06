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
 * own step (per the requirements) but delegates entirely to
 * GenerateVerificationCodeUseCase rather than duplicating that logic.
 */
export class ResendVerificationCodeUseCase implements UseCase<
  ResendVerificationCodeInputDto,
  ResendVerificationCodeOutputDto
> {
  constructor(
    private readonly generateVerificationCodeUseCase: GenerateVerificationCodeUseCase,
  ) {}

  execute(
    input: ResendVerificationCodeInputDto,
  ): Promise<ResendVerificationCodeOutputDto> {
    return this.generateVerificationCodeUseCase.execute(input);
  }
}
