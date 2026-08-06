import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsUUID } from 'class-validator';

export class ListAvailableTimeSlotsQueryDto {
  @ApiProperty({ description: 'Id of the barber to check availability for' })
  @IsUUID()
  barberId: string;

  @ApiProperty({ description: 'Id of the requested qualification' })
  @IsUUID()
  qualificationId: string;

  @ApiProperty({ example: '2025-01-01' })
  @IsDateString()
  date: string;
}
