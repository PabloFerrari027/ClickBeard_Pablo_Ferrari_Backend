import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

import { AuthenticatedRequestUser } from '../types/authenticated-request-user';

/** The user AccessTokenGuard attached to the request — must be used on a route protected by @Auth()/@SelfOrAdmin(). */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedRequestUser => {
    const request = ctx
      .switchToHttp()
      .getRequest<Request & { user: AuthenticatedRequestUser }>();

    return request.user;
  },
);
