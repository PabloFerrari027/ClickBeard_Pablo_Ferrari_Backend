import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';

import { AccessTokenGuard } from '../guards/access-token.guard';
import { SelfOrAdminGuard } from '../guards/self-or-admin.guard';

/**
 * Requires a valid access token, and restricts the action to the
 * account's own owner or an ADMIN. Only meaningful on routes with an
 * `:id` route param identifying the target user.
 */
export const SelfOrAdmin = (): MethodDecorator & ClassDecorator =>
  applyDecorators(
    UseGuards(AccessTokenGuard, SelfOrAdminGuard),
    ApiBearerAuth(),
  );
