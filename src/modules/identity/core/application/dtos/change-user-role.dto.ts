import { UserRole } from '../../domain/enums/user-role.enum';
import { UserDto } from './user.dto';

export interface ChangeUserRoleInputDto {
  userId: string;
  role: UserRole;
}

export interface ChangeUserRoleOutputDto {
  user: UserDto;
}
