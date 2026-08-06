import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class LoginRequestDto {
  @ApiProperty({ example: 'joao.silva@email.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Senha123' })
  @IsString()
  password: string;
}
