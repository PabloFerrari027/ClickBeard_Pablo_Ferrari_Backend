export const USER_DIRECTORY = Symbol('UserDirectory');

/**
 * Read-only snapshot of an Identity user, as seen from the Authentication
 * bounded context. Keeps Authentication decoupled from Identity's domain
 * model while still using Identity as the source of user identity.
 */
export interface AuthUserSnapshot {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: string;
  active: boolean;
}

export interface UserDirectory {
  findByEmail(email: string): Promise<AuthUserSnapshot | null>;
  findById(userId: string): Promise<AuthUserSnapshot | null>;
}
