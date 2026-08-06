import { SetMetadata } from '@nestjs/common';

import { UserRole } from '../../../identity/core/domain/enums/user-role.enum';

export const ROLES_METADATA_KEY = 'roles';

export const Roles = (...roles: UserRole[]): MethodDecorator & ClassDecorator =>
  SetMetadata(ROLES_METADATA_KEY, roles);
