import { InvalidRefreshTokenError } from '../../domain/errors/invalid-refresh-token.error';
import { LogoutInputDto, LogoutOutputDto } from '../dtos/logout.dto';
import { RefreshTokenRepository } from '../ports/refresh-token-repository.port';
import { TokenProvider } from '../ports/token-provider.port';
import { UseCase } from '../../../../../shared/application/use-case';

export class LogoutUseCase implements UseCase<LogoutInputDto, LogoutOutputDto> {
  constructor(
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly tokenProvider: TokenProvider,
  ) {}

  async execute(input: LogoutInputDto): Promise<LogoutOutputDto> {
    const tokenHash = await this.tokenProvider.hashToken(input.refreshToken);
    const storedToken =
      await this.refreshTokenRepository.findByTokenHash(tokenHash);

    if (!storedToken) {
      throw new InvalidRefreshTokenError();
    }

    if (!storedToken.isRevoked()) {
      storedToken.revoke();
      await this.refreshTokenRepository.save(storedToken);
    }

    return { loggedOut: true };
  }
}
