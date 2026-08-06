import { User } from '../../../../identity/core/domain/entities/user.entity';
import { AuthenticatedUserDto } from '../dtos/auth-user.dto';

export function toAuthenticatedUserDto(user: User): AuthenticatedUserDto {
  return {
    id: user.getId(),
    name: user.getName(),
    email: user.getEmail().getValue(),
    role: user.getRole(),
  };
}
