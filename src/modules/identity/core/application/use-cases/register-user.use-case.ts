import { UserAlreadyExistsError } from '../../domain/errors/user-already-exists.error';
import { UserRegisteredEvent } from '../../domain/events/user-registered.event';
import { User } from '../../domain/entities/user.entity';
import { Email } from '../../domain/value-objects/email.value-object';
import { Password } from '../../domain/value-objects/password.value-object';
import { PlainPassword } from '../../domain/value-objects/plain-password.value-object';
import {
  RegisterUserInputDto,
  RegisterUserOutputDto,
} from '../dtos/register-user.dto';
import { toUserDto } from '../mappers/user.mapper';
import { PasswordHasher } from '../ports/password-hasher.port';
import { UserRepository } from '../ports/user-repository.port';
import { EventBus } from '../../../../../shared/application/ports/event-bus.port';
import { UseCase } from '../../../../../shared/application/use-case';

export class RegisterUserUseCase implements UseCase<
  RegisterUserInputDto,
  RegisterUserOutputDto
> {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly eventBus: EventBus,
  ) {}

  async execute(input: RegisterUserInputDto): Promise<RegisterUserOutputDto> {
    const email = Email.create(input.email);
    const existingUser = await this.userRepository.findByEmail(
      email.getValue(),
    );

    if (existingUser) {
      throw new UserAlreadyExistsError(email.getValue());
    }

    const plainPassword = PlainPassword.create(input.password);
    const hash = await this.passwordHasher.hash(plainPassword.getValue());

    const user = User.create({
      name: input.name,
      email,
      password: Password.fromHash(hash),
      birthDate: input.birthDate,
    });

    await this.userRepository.save(user);

    await this.eventBus.publish(
      new UserRegisteredEvent(user.getEmail().getValue(), {
        name: user.getName(),
      }),
    );

    return { user: toUserDto(user) };
  }
}
