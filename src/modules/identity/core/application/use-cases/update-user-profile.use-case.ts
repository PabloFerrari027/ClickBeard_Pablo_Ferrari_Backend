import { UserNotFoundError } from '../../domain/errors/user-not-found.error';
import {
  UpdateUserProfileInputDto,
  UpdateUserProfileOutputDto,
} from '../dtos/update-user-profile.dto';
import { toUserDto } from '../mappers/user.mapper';
import { UserRepository } from '../ports/user-repository.port';
import { UseCase } from '../../../../../shared/application/use-case';

export class UpdateUserProfileUseCase implements UseCase<
  UpdateUserProfileInputDto,
  UpdateUserProfileOutputDto
> {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(
    input: UpdateUserProfileInputDto,
  ): Promise<UpdateUserProfileOutputDto> {
    const user = await this.userRepository.findById(input.userId);

    if (!user) {
      throw new UserNotFoundError();
    }

    if (input.name !== undefined) {
      user.changeName(input.name);
    }

    if (input.birthDate !== undefined) {
      user.changeBirthDate(input.birthDate);
    }

    await this.userRepository.save(user);

    return { user: toUserDto(user) };
  }
}
