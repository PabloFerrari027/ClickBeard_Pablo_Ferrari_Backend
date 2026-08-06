import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsUUID, MinLength } from 'class-validator';

export class ResendVerificationCodeRequestDto {
  @ApiProperty()
  @IsUUID()
  userId: string;

  @ApiProperty({ example: 'joao.silva@email.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Joao Silva' })
  @IsString()
  @MinLength(2)
  name: string;
}
