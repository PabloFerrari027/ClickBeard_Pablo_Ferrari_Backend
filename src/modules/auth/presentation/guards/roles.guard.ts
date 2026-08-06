import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

import { UserRole } from '../../../identity/core/domain/enums/user-role.enum';
import { ROLES_METADATA_KEY } from '../decorators/roles.decorator';
import { AuthenticatedRequestUser } from '../types/authenticated-request-user';

/**
 * Runs after AccessTokenGuard, which is the one that actually populates
 * request.user — this guard only reads it. No metadata (or an empty
 * list) means "any authenticated user is fine", not "deny all".
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_METADATA_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<Request & { user: AuthenticatedRequestUser }>();

    if (!requiredRoles.includes(request.user.role)) {
      throw new ForbiddenException(
        'You do not have permission to perform this action.',
      );
    }

    return true;
  }
}
