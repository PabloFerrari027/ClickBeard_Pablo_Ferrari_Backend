import { RefreshToken } from '../../domain/entities/refresh-token.entity';

export const REFRESH_TOKEN_REPOSITORY = Symbol('RefreshTokenRepository');

export interface RefreshTokenRepository {
  save(refreshToken: RefreshToken): Promise<void>;
  findByTokenHash(tokenHash: string): Promise<RefreshToken | null>;
}
