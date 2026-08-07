/**
 * Signals a broken invariant, not a business rule: by the time
 * `CompleteAuthenticationUseCase` calls `SessionManager.createSession`,
 * it has already confirmed a consumed verification code exists for this
 * user id, so Identity's `User` row is expected to exist too.
 */
export class UserNotFoundForSessionError extends Error {
  constructor(userId: string) {
    super(`User ${userId} was not found while creating a session.`);
    this.name = new.target.name;
  }
}
