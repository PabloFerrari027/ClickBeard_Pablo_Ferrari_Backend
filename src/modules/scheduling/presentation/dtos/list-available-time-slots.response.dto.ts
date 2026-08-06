import { ApiProperty } from '@nestjs/swagger';

import { TimeSlotResponseDto } from './time-slot.response.dto';

export class ListAvailableTimeSlotsResponseDto {
  @ApiProperty({ type: () => TimeSlotResponseDto, isArray: true })
  timeSlots: TimeSlotResponseDto[];
}
