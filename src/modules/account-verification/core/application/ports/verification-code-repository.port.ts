import { VerificationCode } from '../../domain/entities/verification-code.entity';

export const VERIFICATION_CODE_REPOSITORY = Symbol(
  'VerificationCodeRepository',
);

export interface VerificationCodeRepository {
  save(verificationCode: VerificationCode): Promise<void>;
  /** The still-usable code for a user, if any — expired/consumed/invalidated codes don't match. */
  findActiveByUserId(userId: string): Promise<VerificationCode | null>;
  /** The most recently generated code for a user, regardless of its state. */
  findLatestByUserId(userId: string): Promise<VerificationCode | null>;
  /** Active codes whose expiry is in the past, for the cleanup use case. */
  findExpiredActive(now: Date): Promise<VerificationCode[]>;
}
