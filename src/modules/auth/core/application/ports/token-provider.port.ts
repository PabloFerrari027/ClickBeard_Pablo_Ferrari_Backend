export const TOKEN_PROVIDER = Symbol('TokenProvider');

export interface TokenPayload {
  subject: string;
  role: string;
}

export interface GeneratedToken {
  token: string;
  expiresAt: Date;
}

export interface TokenProvider {
  generateAccessToken(payload: TokenPayload): Promise<GeneratedToken>;
  generateRefreshToken(payload: TokenPayload): Promise<GeneratedToken>;
  verifyAccessToken(token: string): Promise<TokenPayload | null>;
  verifyRefreshToken(token: string): Promise<TokenPayload | null>;
  /**
   * Derives the deterministic representation of a raw token used to look
   * it up in the RefreshTokenRepository, so the raw token value itself is
   * never persisted.
   */
  hashToken(token: string): Promise<string>;
}
