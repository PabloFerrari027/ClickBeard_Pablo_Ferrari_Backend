import { ListUsersInputDto, ListUsersOutputDto } from '../dtos/list-users.dto';
import { toUserDto } from '../mappers/user.mapper';
import { UserRepository } from '../ports/user-repository.port';
import {
  computeTotalPages,
  DEFAULT_LIMIT,
  resolvePage,
} from '../../../../../shared/application/pagination';
import { UseCase } from '../../../../../shared/application/use-case';

export class ListUsersUseCase implements UseCase<
  ListUsersInputDto,
  ListUsersOutputDto
> {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(input: ListUsersInputDto): Promise<ListUsersOutputDto> {
    const page = resolvePage(input.page);
    const { users, total } = await this.userRepository.findAll(
      page,
      DEFAULT_LIMIT,
    );

    return {
      users: users.map(toUserDto),
      page,
      totalPages: computeTotalPages(total),
    };
  }
}
