import { ApiProperty } from '@nestjs/swagger';

import { DayOfWeekUsageResponseDto } from './day-of-week-usage.response.dto';
import { TimeSlotUsageResponseDto } from './time-slot-usage.response.dto';

export class AppointmentMetricsResponseDto {
  @ApiProperty()
  totalAppointments: number;

  @ApiProperty()
  appointmentsToday: number;

  @ApiProperty()
  appointmentsThisWeek: number;

  @ApiProperty()
  appointmentsThisMonth: number;

  @ApiProperty()
  appointmentsInPeriod: number;

  @ApiProperty()
  futureAppointments: number;

  @ApiProperty()
  cancelledAppointments: number;

  @ApiProperty({
    description: 'Cancelled / total for the period, as a 0..1 ratio',
  })
  cancellationRate: number;

  @ApiProperty({ type: () => TimeSlotUsageResponseDto, isArray: true })
  mostUsedTimeSlots: TimeSlotUsageResponseDto[];

  @ApiProperty({ type: () => DayOfWeekUsageResponseDto, isArray: true })
  busiestDaysOfWeek: DayOfWeekUsageResponseDto[];
}
