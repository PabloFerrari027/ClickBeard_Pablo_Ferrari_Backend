import { UserNotFoundError } from '../../domain/errors/user-not-found.error';
import {
  ActivateUserInputDto,
  ActivateUserOutputDto,
} from '../dtos/activate-user.dto';
import { toUserDto } from '../mappers/user.mapper';
import { UserRepository } from '../ports/user-repository.port';
import { UseCase } from '../../../../../shared/application/use-case';

export class ActivateUserUseCase implements UseCase<
  ActivateUserInputDto,
  ActivateUserOutputDto
> {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(input: ActivateUserInputDto): Promise<ActivateUserOutputDto> {
    const user = await this.userRepository.findById(input.userId);

    if (!user) {
      throw new UserNotFoundError();
    }

    user.activate();

    await this.userRepository.save(user);

    return { user: toUserDto(user) };
  }
}
