import { RefreshToken } from '../../../core/domain/entities/refresh-token.entity';
import {
  RefreshTokenModel,
  RefreshTokenModelAttributes,
} from '../models/refresh-token.model';

export function toRefreshTokenPersistence(
  refreshToken: RefreshToken,
): RefreshTokenModelAttributes {
  return {
    id: refreshToken.getId(),
    userId: refreshToken.getUserId(),
    tokenHash: refreshToken.getTokenHash(),
    expiresAt: refreshToken.getExpiresAt(),
    revokedAt: refreshToken.getRevokedAt(),
    replacedByTokenId: refreshToken.getReplacedByTokenId(),
    createdAt: refreshToken.getCreatedAt(),
  };
}

export function toRefreshTokenDomain(model: RefreshTokenModel): RefreshToken {
  return RefreshToken.restore({
    id: model.id,
    userId: model.userId,
    tokenHash: model.tokenHash,
    expiresAt: model.expiresAt,
    revokedAt: model.revokedAt,
    replacedByTokenId: model.replacedByTokenId,
    createdAt: model.createdAt,
  });
}
