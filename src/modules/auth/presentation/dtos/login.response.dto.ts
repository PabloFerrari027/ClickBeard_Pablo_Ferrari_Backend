import { ApiProperty } from '@nestjs/swagger';

import { AuthenticatedUserResponseDto } from './authenticated-user.response.dto';

/**
 * Credentials alone do not create a session — the verification code
 * sent after login must be confirmed (Account Verification) before an
 * access/refresh token pair exists.
 */
export class LoginResponseDto {
  @ApiProperty({ type: () => AuthenticatedUserResponseDto })
  user: AuthenticatedUserResponseDto;
}
