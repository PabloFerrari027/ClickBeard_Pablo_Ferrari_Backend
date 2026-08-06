import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class AddQualificationToBarberRequestDto {
  @ApiProperty({ description: 'Id of the admin performing the request' })
  @IsUUID()
  requesterId: string;

  @ApiProperty()
  @IsUUID()
  qualificationId: string;
}
