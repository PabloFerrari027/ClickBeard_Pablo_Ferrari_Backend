import { VerificationCodeAlreadyInvalidatedError } from '../errors/verification-code-already-invalidated.error';
import { VerificationCodeAlreadyUsedError } from '../errors/verification-code-already-used.error';
import {
  VerificationCode,
  VerificationCodeProps,
} from './verification-code.entity';

function buildProps(
  overrides: Partial<VerificationCodeProps> = {},
): VerificationCodeProps {
  return {
    id: 'fixed-id',
    userId: 'user-id',
    codeHash: 'hashed-code',
    expiresAt: new Date('2026-01-01T00:10:00.000Z'),
    attempts: 0,
    consumedAt: null,
    invalidatedAt: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

describe('VerificationCode', () => {
  describe('create', () => {
    it('creates a code that expires 10 minutes after it was generated', () => {
      const generatedAt = new Date('2026-01-01T00:00:00.000Z');

      const code = VerificationCode.create({
        userId: 'user-id',
        codeHash: 'hashed-code',
        generatedAt,
      });

      expect(code.getId()).toBeTruthy();
      expect(code.getUserId()).toBe('user-id');
      expect(code.getCodeHash()).toBe('hashed-code');
      expect(code.getExpiresAt()).toEqual(new Date('2026-01-01T00:10:00.000Z'));
      expect(code.getAttempts()).toBe(0);
      expect(code.isConsumed()).toBe(false);
      expect(code.isInvalidated()).toBe(false);
    });
  });

  describe('recordFailedAttempt', () => {
    it('increments the attempt counter', () => {
      const code = VerificationCode.restore(buildProps());

      code.recordFailedAttempt();
      code.recordFailedAttempt();

      expect(code.getAttempts()).toBe(2);
    });
  });

  describe('hasExceededAttempts', () => {
    it('returns false below the limit and true once reached', () => {
      const code = VerificationCode.restore(buildProps({ attempts: 4 }));

      expect(code.hasExceededAttempts()).toBe(false);

      code.recordFailedAttempt();

      expect(code.hasExceededAttempts()).toBe(true);
    });
  });

  describe('consume', () => {
    it('sets consumedAt', () => {
      const code = VerificationCode.restore(buildProps());
      const now = new Date('2026-01-01T00:05:00.000Z');

      code.consume(now);

      expect(code.isConsumed()).toBe(true);
      expect(code.getConsumedAt()).toEqual(now);
    });

    it('throws VerificationCodeAlreadyUsedError when already consumed', () => {
      const code = VerificationCode.restore(
        buildProps({ consumedAt: new Date('2026-01-01T00:02:00.000Z') }),
      );

      expect(() => code.consume(new Date())).toThrow(
        VerificationCodeAlreadyUsedError,
      );
    });

    it('throws VerificationCodeAlreadyInvalidatedError when invalidated', () => {
      const code = VerificationCode.restore(
        buildProps({ invalidatedAt: new Date('2026-01-01T00:02:00.000Z') }),
      );

      expect(() => code.consume(new Date())).toThrow(
        VerificationCodeAlreadyInvalidatedError,
      );
    });
  });

  describe('invalidate', () => {
    it('sets invalidatedAt', () => {
      const code = VerificationCode.restore(buildProps());
      const now = new Date('2026-01-01T00:05:00.000Z');

      code.invalidate(now);

      expect(code.isInvalidated()).toBe(true);
      expect(code.getInvalidatedAt()).toEqual(now);
    });

    it('throws VerificationCodeAlreadyInvalidatedError when already invalidated', () => {
      const code = VerificationCode.restore(
        buildProps({ invalidatedAt: new Date('2026-01-01T00:02:00.000Z') }),
      );

      expect(() => code.invalidate(new Date())).toThrow(
        VerificationCodeAlreadyInvalidatedError,
      );
    });
  });

  describe('isExpired', () => {
    it('returns false before expiry and true after', () => {
      const code = VerificationCode.restore(buildProps());

      expect(code.isExpired(new Date('2026-01-01T00:05:00.000Z'))).toBe(false);
      expect(code.isExpired(new Date('2026-01-01T00:15:00.000Z'))).toBe(true);
    });
  });

  describe('isActive', () => {
    const now = new Date('2026-01-01T00:05:00.000Z');

    it('returns true when not expired, consumed or invalidated', () => {
      const code = VerificationCode.restore(buildProps());

      expect(code.isActive(now)).toBe(true);
    });

    it('returns false when expired', () => {
      const code = VerificationCode.restore(buildProps());

      expect(code.isActive(new Date('2026-01-01T00:15:00.000Z'))).toBe(false);
    });

    it('returns false when consumed', () => {
      const code = VerificationCode.restore(
        buildProps({ consumedAt: new Date('2026-01-01T00:02:00.000Z') }),
      );

      expect(code.isActive(now)).toBe(false);
    });

    it('returns false when invalidated', () => {
      const code = VerificationCode.restore(
        buildProps({ invalidatedAt: new Date('2026-01-01T00:02:00.000Z') }),
      );

      expect(code.isActive(now)).toBe(false);
    });
  });
});
