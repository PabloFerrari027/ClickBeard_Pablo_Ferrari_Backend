import { InvalidCredentialsError } from '../../domain/errors/invalid-credentials.error';
import { UserNotFoundError } from '../../domain/errors/user-not-found.error';
import { Password } from '../../domain/value-objects/password.value-object';
import { PlainPassword } from '../../domain/value-objects/plain-password.value-object';
import { ChangePasswordInputDto } from '../dtos/change-password.dto';
import { PasswordHasher } from '../ports/password-hasher.port';
import { UserRepository } from '../ports/user-repository.port';
import { UseCase } from '../../../../../shared/application/use-case';

export class ChangePasswordUseCase implements UseCase<
  ChangePasswordInputDto,
  void
> {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(input: ChangePasswordInputDto): Promise<void> {
    const user = await this.userRepository.findById(input.userId);

    if (!user) {
      throw new UserNotFoundError();
    }

    const isCurrentPasswordValid = await this.passwordHasher.compare(
      input.currentPassword,
      user.getPassword().getHash(),
    );

    if (!isCurrentPasswordValid) {
      throw new InvalidCredentialsError();
    }

    const newPlainPassword = PlainPassword.create(input.newPassword);
    const hash = await this.passwordHasher.hash(newPlainPassword.getValue());

    user.changePassword(Password.fromHash(hash));

    await this.userRepository.save(user);
  }
}
