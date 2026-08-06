export interface RefreshTokenInputDto {
  refreshToken: string;
}

export interface RefreshTokenOutputDto {
  accessToken: string;
  accessTokenExpiresAt: Date;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
}
