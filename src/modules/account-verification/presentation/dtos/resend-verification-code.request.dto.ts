import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class ResendVerificationCodeRequestDto {
  @ApiProperty()
  @IsUUID()
  userId: string;
}
