import { InvalidUserRoleError } from '../../domain/errors/invalid-user-role.error';
import { UserNotFoundError } from '../../domain/errors/user-not-found.error';
import { isValidUserRole } from '../../domain/enums/user-role.enum';
import {
  ChangeUserRoleInputDto,
  ChangeUserRoleOutputDto,
} from '../dtos/change-user-role.dto';
import { toUserDto } from '../mappers/user.mapper';
import { UserRepository } from '../ports/user-repository.port';
import { UseCase } from '../../../../../shared/application/use-case';

export class ChangeUserRoleUseCase implements UseCase<
  ChangeUserRoleInputDto,
  ChangeUserRoleOutputDto
> {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(
    input: ChangeUserRoleInputDto,
  ): Promise<ChangeUserRoleOutputDto> {
    if (!isValidUserRole(input.role)) {
      throw new InvalidUserRoleError(input.role);
    }

    const user = await this.userRepository.findById(input.userId);

    if (!user) {
      throw new UserNotFoundError();
    }

    user.changeRole(input.role);

    await this.userRepository.save(user);

    return { user: toUserDto(user) };
  }
}
