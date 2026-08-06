import { AuthenticatedUserDto } from '../dtos/auth-user.dto';
import { AuthUserSnapshot } from '../ports/user-directory.port';

export function toAuthenticatedUserDto(
  user: AuthUserSnapshot,
): AuthenticatedUserDto {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}
