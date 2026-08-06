import { UserRole } from '../../domain/enums/user-role.enum';
import { UserDto } from './user.dto';

export interface ChangeUserRoleInputDto {
  userId: string;
  role: UserRole;
  /** Required when `role` is ADMIN — the id of the ADMIN performing the request. */
  requesterId?: string;
}

export interface ChangeUserRoleOutputDto {
  user: UserDto;
}
