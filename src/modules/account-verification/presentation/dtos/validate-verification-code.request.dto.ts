import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID } from 'class-validator';

export class ValidateVerificationCodeRequestDto {
  @ApiProperty()
  @IsUUID()
  userId: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  code: string;
}
