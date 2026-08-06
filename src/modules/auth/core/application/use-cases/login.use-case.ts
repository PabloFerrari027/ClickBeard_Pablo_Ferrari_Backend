import { PasswordHasher } from '../../../../identity/core/application/ports/password-hasher.port';
import { InvalidCredentialsError } from '../../domain/errors/invalid-credentials.error';
import { UserLoggedInEvent } from '../../domain/events/user-logged-in.event';
import { LoginInputDto, LoginOutputDto } from '../dtos/login.dto';
import { toAuthenticatedUserDto } from '../mappers/auth-user.mapper';
import { UserDirectory } from '../ports/user-directory.port';
import { EventBus } from '../../../../../shared/application/ports/event-bus.port';
import { UseCase } from '../../../../../shared/application/use-case';

export class LoginUseCase implements UseCase<LoginInputDto, LoginOutputDto> {
  constructor(
    private readonly userDirectory: UserDirectory,
    private readonly passwordHasher: PasswordHasher,
    private readonly eventBus: EventBus,
  ) {}

  async execute(input: LoginInputDto): Promise<LoginOutputDto> {
    const user = await this.userDirectory.findByEmail(input.email);

    if (!user || !user.active) {
      throw new InvalidCredentialsError();
    }

    const isPasswordValid = await this.passwordHasher.compare(
      input.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new InvalidCredentialsError();
    }

    await this.eventBus.publish(
      new UserLoggedInEvent(user.email, {
        userId: user.id,
        name: user.name,
      }),
    );

    return { user: toAuthenticatedUserDto(user) };
  }
}
