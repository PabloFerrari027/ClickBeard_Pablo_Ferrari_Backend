import { createHash, randomUUID } from 'node:crypto';

import { Injectable } from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';

import {
  GeneratedToken,
  TokenPayload,
  TokenProvider,
} from '../../core/application/ports/token-provider.port';
import { EnvConfig } from '../../../../shared/config/env.config';

interface JwtClaims {
  sub: string;
  role: string;
  jti: string;
  exp: number;
}

/**
 * Access and refresh tokens use separate secrets and lifetimes (see
 * `EnvConfig`), so `JwtModule` is registered without a default secret —
 * every `sign`/`verify` call here passes its own explicitly instead.
 */
@Injectable()
export class JwtTokenProvider implements TokenProvider {
  constructor(
    private readonly jwtService: JwtService,
    private readonly envConfig: EnvConfig,
  ) {}

  async generateAccessToken(payload: TokenPayload): Promise<GeneratedToken> {
    return this.sign(
      payload,
      this.envConfig.jwtAccessSecret,
      this.envConfig.jwtAccessExpiresIn,
    );
  }

  async generateRefreshToken(payload: TokenPayload): Promise<GeneratedToken> {
    return this.sign(
      payload,
      this.envConfig.jwtRefreshSecret,
      this.envConfig.jwtRefreshExpiresIn,
    );
  }

  async verifyAccessToken(token: string): Promise<TokenPayload | null> {
    return this.verify(token, this.envConfig.jwtAccessSecret);
  }

  async verifyRefreshToken(token: string): Promise<TokenPayload | null> {
    return this.verify(token, this.envConfig.jwtRefreshSecret);
  }

  hashToken(token: string): Promise<string> {
    return Promise.resolve(createHash('sha256').update(token).digest('hex'));
  }

  private async sign(
    payload: TokenPayload,
    secret: string,
    expiresIn: string,
  ): Promise<GeneratedToken> {
    const token = await this.jwtService.signAsync(
      // `jti` guarantees two tokens for the same user never collide even
      // when issued within the same second (jsonwebtoken's `iat` has
      // second granularity) — token_hash is unique per row in
      // refresh_tokens, so a collision would otherwise fail persistence.
      { sub: payload.subject, role: payload.role, jti: randomUUID() },
      {
        secret,
        // `expiresIn` is validated at startup by `EnvConfig` but typed as
        // a plain `string` there to stay library-agnostic; `jsonwebtoken`
        // narrows it to a branded `ms`-parseable literal type.
        expiresIn: expiresIn as JwtSignOptions['expiresIn'],
      },
    );
    const { exp } = this.jwtService.decode<JwtClaims>(token);

    return { token, expiresAt: new Date(exp * 1000) };
  }

  /**
   * Never throws on a malformed/expired/mis-signed token — an invalid
   * token is an expected outcome the port models with `null`, not an
   * infrastructure failure.
   */
  private async verify(
    token: string,
    secret: string,
  ): Promise<TokenPayload | null> {
    try {
      const claims = await this.jwtService.verifyAsync<JwtClaims>(token, {
        secret,
      });

      return { subject: claims.sub, role: claims.role };
    } catch {
      return null;
    }
  }
}
