import { PasswordHasher } from '../../../../identity/core/application/ports/password-hasher.port';
import { UserRepository } from '../../../../identity/core/application/ports/user-repository.port';
import { InvalidCredentialsError } from '../../domain/errors/invalid-credentials.error';
import { UserLoggedInEvent } from '../../domain/events/user-logged-in.event';
import { LoginInputDto, LoginOutputDto } from '../dtos/login.dto';
import { toAuthenticatedUserDto } from '../mappers/auth-user.mapper';
import { EventBus } from '../../../../../shared/application/ports/event-bus.port';
import { UseCase } from '../../../../../shared/application/use-case';

export class LoginUseCase implements UseCase<LoginInputDto, LoginOutputDto> {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly eventBus: EventBus,
  ) {}

  async execute(input: LoginInputDto): Promise<LoginOutputDto> {
    const user = await this.userRepository.findByEmail(input.email);

    if (!user || !user.isActive()) {
      throw new InvalidCredentialsError();
    }

    const isPasswordValid = await this.passwordHasher.compare(
      input.password,
      user.getPassword().getHash(),
    );

    if (!isPasswordValid) {
      throw new InvalidCredentialsError();
    }

    await this.eventBus.publish(
      new UserLoggedInEvent(user.getEmail().getValue(), {
        userId: user.getId(),
        name: user.getName(),
      }),
    );

    return { user: toAuthenticatedUserDto(user) };
  }
}
