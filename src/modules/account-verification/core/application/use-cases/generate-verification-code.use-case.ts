import { PasswordHasher } from '../../../../identity/core/application/ports/password-hasher.port';
import { VerificationCode } from '../../domain/entities/verification-code.entity';
import { VerificationCodeGeneratedEvent } from '../../domain/events/verification-code-generated.event';
import {
  GenerateVerificationCodeInputDto,
  GenerateVerificationCodeOutputDto,
} from '../dtos/generate-verification-code.dto';
import { VerificationCodeRepository } from '../ports/verification-code-repository.port';
import { VerificationCodeGenerator } from '../ports/verification-code-generator.port';
import { EventBus } from '../../../../../shared/application/ports/event-bus.port';
import { UseCase } from '../../../../../shared/application/use-case';

export class GenerateVerificationCodeUseCase implements UseCase<
  GenerateVerificationCodeInputDto,
  GenerateVerificationCodeOutputDto
> {
  constructor(
    private readonly verificationCodeRepository: VerificationCodeRepository,
    private readonly verificationCodeGenerator: VerificationCodeGenerator,
    private readonly passwordHasher: PasswordHasher,
    private readonly eventBus: EventBus,
  ) {}

  async execute(
    input: GenerateVerificationCodeInputDto,
  ): Promise<GenerateVerificationCodeOutputDto> {
    const now = new Date();

    const existingActiveCode =
      await this.verificationCodeRepository.findActiveByUserId(input.userId);

    if (existingActiveCode) {
      existingActiveCode.invalidate(now);
      await this.verificationCodeRepository.save(existingActiveCode);
    }

    const rawCode = await this.verificationCodeGenerator.generate();
    const codeHash = await this.passwordHasher.hash(rawCode);

    const verificationCode = VerificationCode.create({
      userId: input.userId,
      codeHash,
      generatedAt: now,
    });

    await this.verificationCodeRepository.save(verificationCode);

    await this.eventBus.publish(
      new VerificationCodeGeneratedEvent(
        input.email,
        { name: input.name, code: rawCode },
        now,
      ),
    );

    return {
      verificationCodeId: verificationCode.getId(),
      expiresAt: verificationCode.getExpiresAt(),
    };
  }
}
