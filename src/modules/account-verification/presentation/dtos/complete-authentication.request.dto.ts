import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class CompleteAuthenticationRequestDto {
  @ApiProperty()
  @IsUUID()
  userId: string;
}
