import { InvalidEmailError } from '../errors/invalid-email.error';
import { Email } from './email.value-object';

describe('Email', () => {
  describe('create', () => {
    it('normalizes the value by trimming whitespace and lowercasing it', () => {
      const email = Email.create('  John.Doe@Example.COM  ');

      expect(email.getValue()).toBe('john.doe@example.com');
    });

    it('accepts a well-formed email', () => {
      const email = Email.create('user@domain.com');

      expect(email.getValue()).toBe('user@domain.com');
    });

    it.each([
      'not-an-email',
      'missing-domain@',
      '@missing-local.com',
      'no-at-symbol.com',
      'no-tld@domain',
      '   ',
      '',
      'spaces in@email.com',
    ])('rejects the invalid email "%s"', (rawEmail) => {
      expect(() => Email.create(rawEmail)).toThrow(InvalidEmailError);
    });

    it('includes the original raw value in the error message', () => {
      expect(() => Email.create('  Invalid Email  ')).toThrow(
        'The email "  Invalid Email  " is invalid.',
      );
    });
  });

  describe('equals', () => {
    it('returns true for emails with the same normalized value', () => {
      const a = Email.create('User@Example.com');
      const b = Email.create('user@example.com');

      expect(a.equals(b)).toBe(true);
    });

    it('returns false for emails with different values', () => {
      const a = Email.create('a@example.com');
      const b = Email.create('b@example.com');

      expect(a.equals(b)).toBe(false);
    });
  });
});
