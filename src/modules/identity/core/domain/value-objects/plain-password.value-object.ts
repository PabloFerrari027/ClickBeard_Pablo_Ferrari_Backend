import { WeakPasswordError } from '../errors/weak-password.error';

const MIN_LENGTH = 8;
const HAS_LETTER = /[A-Za-z]/;
const HAS_NUMBER = /\d/;

/**
 * Represents a raw, not-yet-hashed password submitted by the user.
 * Enforces the domain's password strength policy before it is handed
 * off to a PasswordHasher port.
 */
export class PlainPassword {
  private readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static create(rawPassword: string): PlainPassword {
    const isTooShort = rawPassword.length < MIN_LENGTH;
    const isMissingLetter = !HAS_LETTER.test(rawPassword);
    const isMissingNumber = !HAS_NUMBER.test(rawPassword);

    if (isTooShort || isMissingLetter || isMissingNumber) {
      throw new WeakPasswordError();
    }

    return new PlainPassword(rawPassword);
  }

  getValue(): string {
    return this.value;
  }
}
