import { ApiProperty } from '@nestjs/swagger';

export class TimeSlotResponseDto {
  @ApiProperty()
  startAt: Date;

  @ApiProperty()
  endAt: Date;
}
