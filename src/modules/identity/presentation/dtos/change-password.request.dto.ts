import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ChangePasswordRequestDto {
  @ApiProperty({ example: 'Senha123' })
  @IsString()
  currentPassword: string;

  @ApiProperty({ example: 'NovaSenha123' })
  @IsString()
  @MinLength(8)
  newPassword: string;
}
