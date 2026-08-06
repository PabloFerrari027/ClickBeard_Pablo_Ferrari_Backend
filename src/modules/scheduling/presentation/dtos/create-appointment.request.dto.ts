import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsUUID } from 'class-validator';

export class CreateAppointmentRequestDto {
  @ApiProperty({ description: 'Id of the barber to book' })
  @IsUUID()
  barberId: string;

  @ApiProperty({ description: 'Id of the requested qualification' })
  @IsUUID()
  qualificationId: string;

  @ApiProperty({ example: '2025-01-01T09:00:00.000Z' })
  @IsDateString()
  startAt: string;
}
