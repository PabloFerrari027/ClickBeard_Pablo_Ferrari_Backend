import { UserNotFoundError } from '../../domain/errors/user-not-found.error';
import {
  GetUserProfileInputDto,
  GetUserProfileOutputDto,
} from '../dtos/get-user-profile.dto';
import { toUserDto } from '../mappers/user.mapper';
import { UserRepository } from '../ports/user-repository.port';
import { UseCase } from '../../../../../shared/application/use-case';

export class GetUserProfileUseCase implements UseCase<
  GetUserProfileInputDto,
  GetUserProfileOutputDto
> {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(
    input: GetUserProfileInputDto,
  ): Promise<GetUserProfileOutputDto> {
    const user = await this.userRepository.findById(input.userId);

    if (!user) {
      throw new UserNotFoundError();
    }

    return { user: toUserDto(user) };
  }
}
