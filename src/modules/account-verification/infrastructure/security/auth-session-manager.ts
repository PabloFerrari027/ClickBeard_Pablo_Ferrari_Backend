import { Inject, Injectable } from '@nestjs/common';

import { UserNotFoundForSessionError } from './errors/user-not-found-for-session.error';
import {
  Session,
  SessionManager,
} from '../../core/application/ports/session-manager.port';
import { REFRESH_TOKEN_REPOSITORY } from '../../../auth/core/application/ports/refresh-token-repository.port';
import { TOKEN_PROVIDER } from '../../../auth/core/application/ports/token-provider.port';
import { RefreshToken } from '../../../auth/core/domain/entities/refresh-token.entity';
import { USER_REPOSITORY } from '../../../identity/core/application/ports/user-repository.port';

import type { RefreshTokenRepository } from '../../../auth/core/application/ports/refresh-token-repository.port';
import type { TokenProvider } from '../../../auth/core/application/ports/token-provider.port';
import type { UserRepository } from '../../../identity/core/application/ports/user-repository.port';

/**
 * Composes Authentication's `TokenProvider` and `RefreshTokenRepository`
 * to issue a session, exactly as the `SessionManager` port's doc
 * comment anticipates — Account Verification's Core never depends on
 * Auth, only this infrastructure adapter does.
 */
@Injectable()
export class AuthSessionManager implements SessionManager {
  constructor(
    @Inject(TOKEN_PROVIDER) private readonly tokenProvider: TokenProvider,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepository: RefreshTokenRepository,
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
  ) {}

  async createSession(userId: string): Promise<Session> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new UserNotFoundForSessionError(userId);
    }

    const tokenPayload = { subject: user.getId(), role: user.getRole() };
    const accessToken =
      await this.tokenProvider.generateAccessToken(tokenPayload);
    const refreshToken =
      await this.tokenProvider.generateRefreshToken(tokenPayload);
    const tokenHash = await this.tokenProvider.hashToken(refreshToken.token);

    await this.refreshTokenRepository.save(
      RefreshToken.create({
        userId: user.getId(),
        tokenHash,
        expiresAt: refreshToken.expiresAt,
      }),
    );

    return {
      accessToken: accessToken.token,
      accessTokenExpiresAt: accessToken.expiresAt,
      refreshToken: refreshToken.token,
      refreshTokenExpiresAt: refreshToken.expiresAt,
    };
  }
}
