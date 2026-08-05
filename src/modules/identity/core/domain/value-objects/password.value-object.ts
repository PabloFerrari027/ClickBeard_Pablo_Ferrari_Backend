/**
 * Represents the hashed form of a user's password, as produced by a
 * PasswordHasher port. This is the only password representation the
 * User entity ever holds or persists.
 */
export class Password {
  private readonly hash: string;

  private constructor(hash: string) {
    this.hash = hash;
  }

  static fromHash(hash: string): Password {
    return new Password(hash);
  }

  getHash(): string {
    return this.hash;
  }

  equals(other: Password): boolean {
    return this.hash === other.hash;
  }
}
