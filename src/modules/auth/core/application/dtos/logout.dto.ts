export interface LogoutInputDto {
  refreshToken: string;
}

export interface LogoutOutputDto {
  loggedOut: boolean;
}
