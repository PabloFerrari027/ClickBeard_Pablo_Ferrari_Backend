import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class AddQualificationToBarberRequestDto {
  @ApiProperty()
  @IsUUID()
  qualificationId: string;
}
