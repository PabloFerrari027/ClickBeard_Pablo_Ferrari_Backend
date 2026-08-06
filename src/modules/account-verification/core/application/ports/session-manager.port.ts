export const SESSION_MANAGER = Symbol('SessionManager');

export interface Session {
  accessToken: string;
  accessTokenExpiresAt: Date;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
}

/**
 * Creates the authenticated session for a user once — and only once —
 * their verification code has been validated. A future adapter will
 * likely compose this from Authentication's TokenProvider and
 * RefreshTokenRepository, but Account Verification's Core stays
 * decoupled from how that actually happens.
 */
export interface SessionManager {
  createSession(userId: string): Promise<Session>;
}
