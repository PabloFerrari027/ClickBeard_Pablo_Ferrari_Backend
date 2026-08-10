import { BarberRoleChangeNotAllowedError } from '../../domain/errors/barber-role-change-not-allowed.error';
import { InvalidUserRoleError } from '../../domain/errors/invalid-user-role.error';
import { UserNotFoundError } from '../../domain/errors/user-not-found.error';
import { UserRoleChangedEvent } from '../../domain/events/user-role-changed.event';
import { isValidUserRole, UserRole } from '../../domain/enums/user-role.enum';
import {
  ChangeUserRoleInputDto,
  ChangeUserRoleOutputDto,
} from '../dtos/change-user-role.dto';
import { toUserDto } from '../mappers/user.mapper';
import { ensureRequesterIsAdmin } from '../policies/ensure-requester-is-admin.policy';
import { UserRepository } from '../ports/user-repository.port';
import { EventBus } from '../../../../../shared/application/ports/event-bus.port';
import { UseCase } from '../../../../../shared/application/use-case';

export class ChangeUserRoleUseCase implements UseCase<
  ChangeUserRoleInputDto,
  ChangeUserRoleOutputDto
> {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(
    input: ChangeUserRoleInputDto,
  ): Promise<ChangeUserRoleOutputDto> {
    if (!isValidUserRole(input.role)) {
      throw new InvalidUserRoleError(input.role);
    }

    if (input.role === UserRole.BARBER) {
      throw new BarberRoleChangeNotAllowedError();
    }

    if (input.role === UserRole.ADMIN) {
      if (!input.requesterId) {
        throw new UserNotFoundError();
      }

      await ensureRequesterIsAdmin(this.userRepository, input.requesterId);
    }

    const user = await this.userRepository.findById(input.userId);

    if (!user) {
      throw new UserNotFoundError();
    }

    const previousRole = user.getRole();

    user.changeRole(input.role);

    await this.userRepository.save(user);

    await this.eventBus.publish(
      new UserRoleChangedEvent({
        userId: user.getId(),
        previousRole,
        newRole: user.getRole(),
      }),
    );

    return { user: toUserDto(user) };
  }
}
