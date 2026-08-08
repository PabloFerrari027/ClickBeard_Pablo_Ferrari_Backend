import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Request } from 'express';

import { AuthenticatedRequestUser } from '../types/authenticated-request-user';

/**
 * Allows the action only when the authenticated user is acting on their
 * own account (`:id` route param matches their id) — unlike
 * `SelfOrAdminGuard`, ADMIN gets no bypass here. Runs after
 * AccessTokenGuard, which populates request.user.
 */
@Injectable()
export class SelfGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user: AuthenticatedRequestUser }>();

    const { user } = request;
    const targetUserId = request.params.id;

    if (user.id === targetUserId) {
      return true;
    }

    throw new ForbiddenException(
      'You can only perform this action on your own account.',
    );
  }
}
