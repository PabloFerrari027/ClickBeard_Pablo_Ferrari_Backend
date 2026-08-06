import { ApiProperty } from '@nestjs/swagger';

export class ResendVerificationCodeResponseDto {
  @ApiProperty()
  verificationCodeId: string;

  @ApiProperty()
  expiresAt: Date;
}
