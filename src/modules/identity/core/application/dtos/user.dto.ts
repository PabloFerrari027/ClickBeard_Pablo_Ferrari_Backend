import { UserRole } from '../../domain/enums/user-role.enum';

export interface UserDto {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  birthDate?: Date;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}
