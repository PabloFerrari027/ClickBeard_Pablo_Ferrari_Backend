import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';

import { AccessTokenGuard } from '../guards/access-token.guard';
import { SelfGuard } from '../guards/self.guard';

/**
 * Requires a valid access token, and restricts the action to the
 * account's own owner — not even an ADMIN can act on someone else's
 * behalf here. Only meaningful on routes with an `:id` route param
 * identifying the target user.
 */
export const Self = (): MethodDecorator & ClassDecorator =>
  applyDecorators(UseGuards(AccessTokenGuard, SelfGuard), ApiBearerAuth());
