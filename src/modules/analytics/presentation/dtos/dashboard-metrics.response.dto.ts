import { ApiProperty } from '@nestjs/swagger';

import { AppointmentMetricsResponseDto } from './appointment-metrics.response.dto';
import { BarberMetricsResponseDto } from './barber-metrics.response.dto';
import { CustomerMetricsResponseDto } from './customer-metrics.response.dto';
import { OccupationMetricsResponseDto } from './occupation-metrics.response.dto';
import { UserMetricsResponseDto } from './user-metrics.response.dto';

export class DashboardMetricsResponseDto {
  @ApiProperty({ type: () => UserMetricsResponseDto })
  users: UserMetricsResponseDto;

  @ApiProperty({ type: () => AppointmentMetricsResponseDto })
  appointments: AppointmentMetricsResponseDto;

  @ApiProperty({ type: () => BarberMetricsResponseDto })
  barbers: BarberMetricsResponseDto;

  @ApiProperty({ type: () => CustomerMetricsResponseDto })
  customers: CustomerMetricsResponseDto;

  @ApiProperty({ type: () => OccupationMetricsResponseDto })
  occupation: OccupationMetricsResponseDto;
}
