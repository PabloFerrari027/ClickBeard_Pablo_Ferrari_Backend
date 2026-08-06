import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';

import { USER_REPOSITORY } from '../../../identity/core/application/ports/user-repository.port';
import { TOKEN_PROVIDER } from '../../core/application/ports/token-provider.port';
import { AuthenticatedRequestUser } from '../types/authenticated-request-user';

import type { UserRepository } from '../../../identity/core/application/ports/user-repository.port';
import type { TokenProvider } from '../../core/application/ports/token-provider.port';

/**
 * Validates the Bearer access token, loads the user from Identity and
 * attaches it to the request. "Account not yet verified" is not
 * re-checked here: SessionManager.createSession (Account Verification)
 * is the only path that ever issues a token, and it only runs once the
 * user's verification code has been consumed — an access token simply
 * cannot exist for an unverified account, so there's nothing to
 * duplicate from that module's own rule at this layer.
 */
@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(
    @Inject(TOKEN_PROVIDER) private readonly tokenProvider: TokenProvider,
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('Missing access token.');
    }

    const payload = await this.tokenProvider.verifyAccessToken(token);

    if (!payload) {
      throw new UnauthorizedException('Invalid or expired access token.');
    }

    const user = await this.userRepository.findById(payload.subject);

    if (!user) {
      throw new UnauthorizedException('User not found.');
    }

    if (!user.isActive()) {
      throw new UnauthorizedException('User account is deactivated.');
    }

    const authenticatedUser: AuthenticatedRequestUser = {
      id: user.getId(),
      role: user.getRole(),
    };

    (request as Request & { user: AuthenticatedRequestUser }).user =
      authenticatedUser;

    return true;
  }

  private extractToken(request: Request): string | null {
    const header = request.headers.authorization;

    if (!header?.startsWith('Bearer ')) {
      return null;
    }

    return header.slice('Bearer '.length).trim() || null;
  }
}
