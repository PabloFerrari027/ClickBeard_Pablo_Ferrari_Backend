import { ApiProperty } from '@nestjs/swagger';

export class DayOfWeekUsageResponseDto {
  @ApiProperty({
    minimum: 0,
    maximum: 6,
    description: '0 (Sunday) - 6 (Saturday)',
  })
  dayOfWeek: number;

  @ApiProperty()
  total: number;
}
