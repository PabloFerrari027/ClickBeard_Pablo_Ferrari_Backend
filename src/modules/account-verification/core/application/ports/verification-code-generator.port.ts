export const VERIFICATION_CODE_GENERATOR = Symbol('VerificationCodeGenerator');

export interface VerificationCodeGenerator {
  /** Generates the raw, plaintext code (e.g. a 6-digit number) to send to the user. */
  generate(): Promise<string>;
}
