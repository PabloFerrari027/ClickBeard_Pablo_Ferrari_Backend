import { ApiProperty } from '@nestjs/swagger';

export class BarberUnavailabilityResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  barberId: string;

  @ApiProperty()
  startAt: Date;

  @ApiProperty()
  endAt: Date;

  @ApiProperty()
  reason: string;

  @ApiProperty()
  createdAt: Date;
}
