import { InvalidBirthDateError } from '../errors/invalid-birth-date.error';

export class BirthDate {
  private readonly value: Date;

  private constructor(value: Date) {
    this.value = value;
  }

  static create(rawBirthDate: string | Date): BirthDate {
    const date = new Date(rawBirthDate);
    const isValid =
      !Number.isNaN(date.getTime()) && date.getTime() <= Date.now();

    if (!isValid) {
      throw new InvalidBirthDateError();
    }

    return new BirthDate(date);
  }

  getValue(): Date {
    return this.value;
  }

  equals(other: BirthDate): boolean {
    return this.value.getTime() === other.value.getTime();
  }
}
