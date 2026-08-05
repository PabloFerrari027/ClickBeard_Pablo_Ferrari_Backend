import { Password } from './password.value-object';

describe('Password', () => {
  describe('fromHash', () => {
    it('stores and exposes the given hash', () => {
      const password = Password.fromHash('hashed-value');

      expect(password.getHash()).toBe('hashed-value');
    });
  });

  describe('equals', () => {
    it('returns true when both passwords have the same hash', () => {
      const a = Password.fromHash('same-hash');
      const b = Password.fromHash('same-hash');

      expect(a.equals(b)).toBe(true);
    });

    it('returns false when hashes differ', () => {
      const a = Password.fromHash('hash-a');
      const b = Password.fromHash('hash-b');

      expect(a.equals(b)).toBe(false);
    });
  });
});
