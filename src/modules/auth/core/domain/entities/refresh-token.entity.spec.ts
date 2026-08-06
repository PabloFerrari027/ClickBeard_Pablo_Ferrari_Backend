import { RefreshTokenAlreadyRevokedError } from '../errors/refresh-token-already-revoked.error';
import { RefreshToken, RefreshTokenProps } from './refresh-token.entity';

function buildProps(
  overrides: Partial<RefreshTokenProps> = {},
): RefreshTokenProps {
  return {
    id: 'fixed-id',
    userId: 'user-id',
    tokenHash: 'hashed-token',
    expiresAt: new Date('2026-01-08T00:00:00.000Z'),
    revokedAt: null,
    replacedByTokenId: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

describe('RefreshToken', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  describe('create', () => {
    it('creates a refresh token with no revocation and a generated id', () => {
      const expiresAt = new Date('2026-01-08T00:00:00.000Z');

      const refreshToken = RefreshToken.create({
        userId: 'user-id',
        tokenHash: 'hashed-token',
        expiresAt,
      });

      expect(refreshToken.getId()).toBeTruthy();
      expect(refreshToken.getUserId()).toBe('user-id');
      expect(refreshToken.getTokenHash()).toBe('hashed-token');
      expect(refreshToken.getExpiresAt()).toBe(expiresAt);
      expect(refreshToken.getRevokedAt()).toBeNull();
      expect(refreshToken.getReplacedByTokenId()).toBeNull();
      expect(refreshToken.isRevoked()).toBe(false);
    });
  });

  describe('isExpired', () => {
    it('returns false when the expiration date is in the future', () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-01-05T00:00:00.000Z'));

      const refreshToken = RefreshToken.restore(buildProps());

      expect(refreshToken.isExpired()).toBe(false);
    });

    it('returns true when the expiration date is in the past', () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-01-09T00:00:00.000Z'));

      const refreshToken = RefreshToken.restore(buildProps());

      expect(refreshToken.isExpired()).toBe(true);
    });
  });

  describe('revoke', () => {
    it('sets revokedAt and leaves replacedByTokenId null when not rotating', () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-01-05T00:00:00.000Z'));

      const refreshToken = RefreshToken.restore(buildProps());

      refreshToken.revoke();

      expect(refreshToken.isRevoked()).toBe(true);
      expect(refreshToken.getRevokedAt()).toEqual(
        new Date('2026-01-05T00:00:00.000Z'),
      );
      expect(refreshToken.getReplacedByTokenId()).toBeNull();
    });

    it('sets replacedByTokenId when rotating into a new token', () => {
      const refreshToken = RefreshToken.restore(buildProps());

      refreshToken.revoke('new-token-id');

      expect(refreshToken.getReplacedByTokenId()).toBe('new-token-id');
    });

    it('throws RefreshTokenAlreadyRevokedError when already revoked', () => {
      const refreshToken = RefreshToken.restore(
        buildProps({ revokedAt: new Date('2026-01-02T00:00:00.000Z') }),
      );

      expect(() => refreshToken.revoke()).toThrow(
        RefreshTokenAlreadyRevokedError,
      );
    });
  });

  describe('isValid', () => {
    it('returns true when neither expired nor revoked', () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-01-05T00:00:00.000Z'));

      const refreshToken = RefreshToken.restore(buildProps());

      expect(refreshToken.isValid()).toBe(true);
    });

    it('returns false when expired', () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-01-09T00:00:00.000Z'));

      const refreshToken = RefreshToken.restore(buildProps());

      expect(refreshToken.isValid()).toBe(false);
    });

    it('returns false when revoked', () => {
      const refreshToken = RefreshToken.restore(
        buildProps({ revokedAt: new Date('2026-01-02T00:00:00.000Z') }),
      );

      expect(refreshToken.isValid()).toBe(false);
    });
  });
});
