import { InvalidBarberAgeError } from '../errors/invalid-barber-age.error';
import { Age } from './age.value-object';

describe('Age', () => {
  describe('create', () => {
    it('creates an age with a valid integer value', () => {
      const age = Age.create(30);

      expect(age.getValue()).toBe(30);
    });

    it('accepts the minimum boundary value of 18', () => {
      const age = Age.create(18);

      expect(age.getValue()).toBe(18);
    });

    it('accepts the maximum boundary value of 100', () => {
      const age = Age.create(100);

      expect(age.getValue()).toBe(100);
    });

    it('throws InvalidBarberAgeError when the value is below the minimum', () => {
      expect(() => Age.create(17)).toThrow(InvalidBarberAgeError);
    });

    it('throws InvalidBarberAgeError when the value is above the maximum', () => {
      expect(() => Age.create(101)).toThrow(InvalidBarberAgeError);
    });

    it('throws InvalidBarberAgeError when the value is not an integer', () => {
      expect(() => Age.create(30.5)).toThrow(InvalidBarberAgeError);
    });
  });

  describe('equals', () => {
    it('returns true for ages with the same value', () => {
      const a = Age.create(25);
      const b = Age.create(25);

      expect(a.equals(b)).toBe(true);
    });

    it('returns false for ages with different values', () => {
      const a = Age.create(25);
      const b = Age.create(26);

      expect(a.equals(b)).toBe(false);
    });
  });
});
