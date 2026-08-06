import { ApiProperty } from '@nestjs/swagger';

import { TimeSlotResponseDto } from './time-slot.response.dto';

export class BarberOccupationResponseDto {
  @ApiProperty()
  barberId: string;

  @ApiProperty()
  barberName: string;

  @ApiProperty()
  bookedSlots: number;

  @ApiProperty()
  availableSlots: number;

  @ApiProperty({
    description: 'bookedSlots / availableSlots, as a 0..1 ratio',
  })
  occupancyRate: number;

  @ApiProperty({ type: () => TimeSlotResponseDto, isArray: true })
  freeTimeSlots: TimeSlotResponseDto[];
}
