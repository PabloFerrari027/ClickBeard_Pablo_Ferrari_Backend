import { UserRepository } from '../../../../identity/core/application/ports/user-repository.port';
import { InvalidRefreshTokenError } from '../../domain/errors/invalid-refresh-token.error';
import { RefreshTokenExpiredError } from '../../domain/errors/refresh-token-expired.error';
import { RefreshToken } from '../../domain/entities/refresh-token.entity';
import {
  RefreshTokenInputDto,
  RefreshTokenOutputDto,
} from '../dtos/refresh-token.dto';
import { RefreshTokenRepository } from '../ports/refresh-token-repository.port';
import { TokenProvider } from '../ports/token-provider.port';
import { UseCase } from '../../../../../shared/application/use-case';

export class RefreshTokenUseCase implements UseCase<
  RefreshTokenInputDto,
  RefreshTokenOutputDto
> {
  constructor(
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly tokenProvider: TokenProvider,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(input: RefreshTokenInputDto): Promise<RefreshTokenOutputDto> {
    const payload = await this.tokenProvider.verifyRefreshToken(
      input.refreshToken,
    );

    if (!payload) {
      throw new InvalidRefreshTokenError();
    }

    const tokenHash = await this.tokenProvider.hashToken(input.refreshToken);
    const storedToken =
      await this.refreshTokenRepository.findByTokenHash(tokenHash);

    if (!storedToken || storedToken.getUserId() !== payload.subject) {
      throw new InvalidRefreshTokenError();
    }

    if (storedToken.isRevoked()) {
      throw new InvalidRefreshTokenError();
    }

    if (storedToken.isExpired()) {
      throw new RefreshTokenExpiredError();
    }

    const user = await this.userRepository.findById(storedToken.getUserId());

    if (!user || !user.isActive()) {
      throw new InvalidRefreshTokenError();
    }

    const newAccessToken = await this.tokenProvider.generateAccessToken({
      subject: user.getId(),
      role: user.getRole(),
    });
    const newRefreshToken = await this.tokenProvider.generateRefreshToken({
      subject: user.getId(),
      role: user.getRole(),
    });
    const newRefreshTokenHash = await this.tokenProvider.hashToken(
      newRefreshToken.token,
    );

    const rotatedToken = RefreshToken.create({
      userId: user.getId(),
      tokenHash: newRefreshTokenHash,
      expiresAt: newRefreshToken.expiresAt,
    });

    storedToken.revoke(rotatedToken.getId());

    // The rotated token must exist before the old one can reference it
    // via replaced_by_token_id (a foreign key onto this same table).
    await this.refreshTokenRepository.save(rotatedToken);
    await this.refreshTokenRepository.save(storedToken);

    return {
      accessToken: newAccessToken.token,
      accessTokenExpiresAt: newAccessToken.expiresAt,
      refreshToken: newRefreshToken.token,
      refreshTokenExpiresAt: newRefreshToken.expiresAt,
    };
  }
}
