import { InvalidBarberAgeError } from '../errors/invalid-barber-age.error';

const MIN_AGE = 18;
const MAX_AGE = 100;

export class Age {
  private readonly value: number;

  private constructor(value: number) {
    this.value = value;
  }

  static create(rawAge: number): Age {
    const isValid =
      Number.isInteger(rawAge) && rawAge >= MIN_AGE && rawAge <= MAX_AGE;

    if (!isValid) {
      throw new InvalidBarberAgeError();
    }

    return new Age(rawAge);
  }

  getValue(): number {
    return this.value;
  }

  equals(other: Age): boolean {
    return this.value === other.value;
  }
}
