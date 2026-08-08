import { InvalidBirthDateError } from '../errors/invalid-birth-date.error';
import { BirthDate } from './birth-date.value-object';

describe('BirthDate', () => {
  describe('create', () => {
    it('creates a birth date from a valid past date string', () => {
      const birthDate = BirthDate.create('1995-05-20');

      expect(birthDate.getValue()).toEqual(new Date('1995-05-20'));
    });

    it('creates a birth date from a valid past Date instance', () => {
      const date = new Date('1995-05-20');
      const birthDate = BirthDate.create(date);

      expect(birthDate.getValue()).toEqual(date);
    });

    it('throws InvalidBirthDateError for a date in the future', () => {
      expect(() => BirthDate.create('2999-01-01')).toThrow(
        InvalidBirthDateError,
      );
    });

    it('throws InvalidBirthDateError for an unparseable value', () => {
      expect(() => BirthDate.create('not-a-date')).toThrow(
        InvalidBirthDateError,
      );
    });
  });

  describe('equals', () => {
    it('returns true for birth dates with the same value', () => {
      const a = BirthDate.create('1995-05-20');
      const b = BirthDate.create('1995-05-20');

      expect(a.equals(b)).toBe(true);
    });

    it('returns false for birth dates with different values', () => {
      const a = BirthDate.create('1995-05-20');
      const b = BirthDate.create('1996-05-20');

      expect(a.equals(b)).toBe(false);
    });
  });
});
