import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';

import { UserRole } from '../../../identity/core/domain/enums/user-role.enum';
import { AccessTokenGuard } from '../guards/access-token.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from './roles.decorator';

/**
 * The one decorator routes need: requires a valid access token, and
 * optionally restricts it to the given roles. `@Auth()` with no roles
 * means "any authenticated user"; `@Auth(UserRole.ADMIN)` restricts to
 * admins, `@Auth(UserRole.ADMIN, UserRole.BARBER)` to either.
 */
export const Auth = (...roles: UserRole[]): MethodDecorator & ClassDecorator =>
  applyDecorators(
    UseGuards(AccessTokenGuard, RolesGuard),
    Roles(...roles),
    ApiBearerAuth(),
  );
