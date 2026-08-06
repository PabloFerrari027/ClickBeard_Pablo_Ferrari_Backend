import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class RemoveQualificationFromBarberRequestDto {
  @ApiProperty({ description: 'Id of the admin performing the request' })
  @IsUUID()
  requesterId: string;
}
