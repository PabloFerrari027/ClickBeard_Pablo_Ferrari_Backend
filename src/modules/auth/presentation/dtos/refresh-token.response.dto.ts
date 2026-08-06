import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenResponseDto {
  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  accessTokenExpiresAt: Date;

  @ApiProperty()
  refreshToken: string;

  @ApiProperty()
  refreshTokenExpiresAt: Date;
}
