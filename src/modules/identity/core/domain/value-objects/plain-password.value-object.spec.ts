import { WeakPasswordError } from '../errors/weak-password.error';
import { PlainPassword } from './plain-password.value-object';

describe('PlainPassword', () => {
  describe('create', () => {
    it('accepts a password that meets the strength policy', () => {
      const password = PlainPassword.create('password1');

      expect(password.getValue()).toBe('password1');
    });

    it('accepts a password exactly at the minimum length', () => {
      const password = PlainPassword.create('abcdefg1');

      expect(password.getValue()).toBe('abcdefg1');
    });

    it('rejects a password shorter than the minimum length', () => {
      expect(() => PlainPassword.create('abc1')).toThrow(WeakPasswordError);
    });

    it('rejects a password without any letter', () => {
      expect(() => PlainPassword.create('12345678')).toThrow(WeakPasswordError);
    });

    it('rejects a password without any number', () => {
      expect(() => PlainPassword.create('abcdefgh')).toThrow(WeakPasswordError);
    });

    it('rejects an empty password', () => {
      expect(() => PlainPassword.create('')).toThrow(WeakPasswordError);
    });
  });
});
