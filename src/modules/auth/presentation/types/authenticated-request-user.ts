import { UserRole } from '../../../identity/core/domain/enums/user-role.enum';

/** What AccessTokenGuard attaches to `request.user` once a token is verified. */
export interface AuthenticatedRequestUser {
  id: string;
  role: UserRole;
}
