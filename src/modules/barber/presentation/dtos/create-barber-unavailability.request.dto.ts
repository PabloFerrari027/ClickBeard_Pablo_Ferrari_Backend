import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsString, MinLength } from 'class-validator';

export class CreateBarberUnavailabilityRequestDto {
  @ApiProperty({ example: '2026-08-10T00:00:00.000Z' })
  @IsDateString()
  startAt: string;

  @ApiProperty({ example: '2026-08-12T00:00:00.000Z' })
  @IsDateString()
  endAt: string;

  @ApiProperty({ example: 'Sick leave' })
  @IsString()
  @MinLength(3)
  reason: string;
}
