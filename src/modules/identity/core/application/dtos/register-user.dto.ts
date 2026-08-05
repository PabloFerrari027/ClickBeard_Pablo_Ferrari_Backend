import { UserRole } from '../../domain/enums/user-role.enum';
import { UserDto } from './user.dto';

export interface RegisterUserInputDto {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
}

export interface RegisterUserOutputDto {
  user: UserDto;
}
