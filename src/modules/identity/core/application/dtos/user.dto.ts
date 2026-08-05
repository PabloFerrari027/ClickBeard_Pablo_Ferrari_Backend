import { UserRole } from '../../domain/enums/user-role.enum';

export interface UserDto {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}
