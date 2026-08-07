import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class CancelAppointmentByAdminRequestDto {
  @ApiProperty({ example: 'Barber called in sick' })
  @IsString()
  @MinLength(3)
  reason: string;
}
