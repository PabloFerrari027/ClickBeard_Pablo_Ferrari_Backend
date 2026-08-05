import { UserNotFoundError } from '../../domain/errors/user-not-found.error';
import {
  DeactivateUserInputDto,
  DeactivateUserOutputDto,
} from '../dtos/deactivate-user.dto';
import { toUserDto } from '../mappers/user.mapper';
import { UserRepository } from '../ports/user-repository.port';
import { UseCase } from '../../../../../shared/application/use-case';

export class DeactivateUserUseCase implements UseCase<
  DeactivateUserInputDto,
  DeactivateUserOutputDto
> {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(
    input: DeactivateUserInputDto,
  ): Promise<DeactivateUserOutputDto> {
    const user = await this.userRepository.findById(input.userId);

    if (!user) {
      throw new UserNotFoundError();
    }

    user.deactivate();

    await this.userRepository.save(user);

    return { user: toUserDto(user) };
  }
}
