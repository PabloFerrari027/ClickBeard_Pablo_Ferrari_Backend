import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Request } from 'express';

import { UserRole } from '../../../identity/core/domain/enums/user-role.enum';
import { AuthenticatedRequestUser } from '../types/authenticated-request-user';

/**
 * Allows the action when the authenticated user is an ADMIN or is
 * acting on their own account (`:id` route param matches their id).
 * Runs after AccessTokenGuard, which populates request.user.
 */
@Injectable()
export class SelfOrAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user: AuthenticatedRequestUser }>();

    const { user } = request;
    const targetUserId = request.params.id;

    if (user.role === UserRole.ADMIN || user.id === targetUserId) {
      return true;
    }

    throw new ForbiddenException(
      'You can only perform this action on your own account.',
    );
  }
}
