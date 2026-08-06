import { GenerateVerificationCodeUseCase } from './generate-verification-code.use-case';
import { ResendVerificationCodeUseCase } from './resend-verification-code.use-case';

describe('ResendVerificationCodeUseCase', () => {
  it('delegates execution to GenerateVerificationCodeUseCase', async () => {
    const generateVerificationCodeUseCase = {
      execute: jest.fn().mockResolvedValue({
        verificationCodeId: 'new-id',
        expiresAt: new Date('2026-01-01T00:10:00.000Z'),
      }),
    } as unknown as jest.Mocked<GenerateVerificationCodeUseCase>;

    const useCase = new ResendVerificationCodeUseCase(
      generateVerificationCodeUseCase,
    );

    const input = {
      userId: 'user-id',
      email: 'jane@example.com',
      name: 'Jane Doe',
    };
    const result = await useCase.execute(input);

    expect(generateVerificationCodeUseCase.execute).toHaveBeenCalledWith(input);
    expect(result).toEqual({
      verificationCodeId: 'new-id',
      expiresAt: new Date('2026-01-01T00:10:00.000Z'),
    });
  });
});
