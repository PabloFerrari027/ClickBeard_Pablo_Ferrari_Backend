import { AuthenticatedUserDto } from './auth-user.dto';

export interface LoginInputDto {
  email: string;
  password: string;
}

/**
 * Credentials alone do not create a session — LoginUseCase only confirms
 * them and publishes UserLoggedIn. The session is created later by
 * Account Verification's CompleteAuthenticationUseCase, once the emailed
 * verification code has been validated.
 */
export interface LoginOutputDto {
  user: AuthenticatedUserDto;
}
