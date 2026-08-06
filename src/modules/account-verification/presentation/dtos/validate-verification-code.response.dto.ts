import { ApiProperty } from '@nestjs/swagger';

export class ValidateVerificationCodeResponseDto {
  @ApiProperty()
  verified: boolean;
}
