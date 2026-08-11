import { UserNotFoundError } from '../../../../identity/core/domain/errors/user-not-found.error';
import { UserRepository } from '../../../../identity/core/application/ports/user-repository.port';
import { GenerateVerificationCodeUseCase } from './generate-verification-code.use-case';
import { ResendVerificationCodeUseCase } from './resend-verification-code.use-case';

describe('ResendVerificationCodeUseCase', () => {
  let userRepository: jest.Mocked<UserRepository>;
  let generateVerificationCodeUseCase: jest.Mocked<GenerateVerificationCodeUseCase>;
  let useCase: ResendVerificationCodeUseCase;

  beforeEach(() => {
    userRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findAll: jest.fn(),
    };
    generateVerificationCodeUseCase = {
      execute: jest.fn().mockResolvedValue({
        verificationCodeId: 'new-id',
        expiresAt: new Date('2026-01-01T00:10:00.000Z'),
      }),
    } as unknown as jest.Mocked<GenerateVerificationCodeUseCase>;

    useCase = new ResendVerificationCodeUseCase(
      userRepository,
      generateVerificationCodeUseCase,
    );
  });

  it('resolves the recipient email/name from the user record rather than the caller', async () => {
    const user = {
      getId: () => 'user-id',
      getEmail: () => ({ getValue: () => 'jane@example.com' }),
      getName: () => 'Jane Doe',
    } as unknown as Awaited<ReturnType<UserRepository['findById']>>;
    userRepository.findById.mockResolvedValue(user);

    const result = await useCase.execute({ userId: 'user-id' });

    expect(userRepository.findById).toHaveBeenCalledWith('user-id');
    expect(generateVerificationCodeUseCase.execute).toHaveBeenCalledWith({
      userId: 'user-id',
      email: 'jane@example.com',
      name: 'Jane Doe',
    });
    expect(result).toEqual({
      verificationCodeId: 'new-id',
      expiresAt: new Date('2026-01-01T00:10:00.000Z'),
    });
  });

  it('throws UserNotFoundError when the userId does not match any user', async () => {
    userRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute({ userId: 'missing-id' })).rejects.toThrow(
      UserNotFoundError,
    );
    expect(generateVerificationCodeUseCase.execute).not.toHaveBeenCalled();
  });
});
