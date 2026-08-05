import { InvalidCredentialsError } from '../../domain/errors/invalid-credentials.error';
import { Email } from '../../domain/value-objects/email.value-object';
import {
  AuthenticateUserInputDto,
  AuthenticateUserOutputDto,
} from '../dtos/authenticate-user.dto';
import { toUserDto } from '../mappers/user.mapper';
import { PasswordHasher } from '../ports/password-hasher.port';
import { UserRepository } from '../ports/user-repository.port';
import { UseCase } from '../../../../../shared/application/use-case';

export class AuthenticateUserUseCase implements UseCase<
  AuthenticateUserInputDto,
  AuthenticateUserOutputDto
> {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(
    input: AuthenticateUserInputDto,
  ): Promise<AuthenticateUserOutputDto> {
    const email = Email.create(input.email);
    const user = await this.userRepository.findByEmail(email.getValue());

    if (!user) {
      throw new InvalidCredentialsError();
    }

    const isPasswordValid = await this.passwordHasher.compare(
      input.password,
      user.getPassword().getHash(),
    );

    if (!isPasswordValid) {
      throw new InvalidCredentialsError();
    }

    return { user: toUserDto(user) };
  }
}
