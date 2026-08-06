export const USER_DIRECTORY = Symbol('UserDirectory');

/**
 * Read-only snapshot of an Identity user, as seen from the Barber
 * bounded context. Keeps Barber decoupled from Identity's domain model.
 */
export interface UserSnapshot {
  id: string;
  name: string;
  role: string;
  active: boolean;
}

export interface UserDirectory {
  findById(userId: string): Promise<UserSnapshot | null>;
}
