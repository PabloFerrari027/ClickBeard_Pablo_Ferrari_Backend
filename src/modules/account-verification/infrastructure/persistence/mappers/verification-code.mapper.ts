import { VerificationCode } from '../../../core/domain/entities/verification-code.entity';
import {
  VerificationCodeModel,
  VerificationCodeModelAttributes,
} from '../models/verification-code.model';

export function toVerificationCodePersistence(
  verificationCode: VerificationCode,
): VerificationCodeModelAttributes {
  return {
    id: verificationCode.getId(),
    userId: verificationCode.getUserId(),
    codeHash: verificationCode.getCodeHash(),
    expiresAt: verificationCode.getExpiresAt(),
    attempts: verificationCode.getAttempts(),
    consumedAt: verificationCode.getConsumedAt(),
    invalidatedAt: verificationCode.getInvalidatedAt(),
    createdAt: verificationCode.getCreatedAt(),
  };
}

export function toVerificationCodeDomain(
  model: VerificationCodeModel,
): VerificationCode {
  return VerificationCode.restore({
    id: model.id,
    userId: model.userId,
    codeHash: model.codeHash,
    expiresAt: model.expiresAt,
    attempts: model.attempts,
    consumedAt: model.consumedAt,
    invalidatedAt: model.invalidatedAt,
    createdAt: model.createdAt,
  });
}
