import { ApiProperty } from '@nestjs/swagger';

export class TimeSlotUsageResponseDto {
  @ApiProperty({
    example: '10:00',
    description: '"HH:mm", aggregated across every day in the queried range',
  })
  startTime: string;

  @ApiProperty()
  total: number;
}
