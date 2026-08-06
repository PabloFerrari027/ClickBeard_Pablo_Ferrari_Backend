import { AppointmentMetricsDto } from './appointment-metrics.dto';
import { BarberMetricsDto } from './barber-metrics.dto';
import { CustomerMetricsDto } from './customer-metrics.dto';
import { OccupationMetricsDto } from './occupation-metrics.dto';
import { UserMetricsDto } from './user-metrics.dto';

export interface DashboardMetricsDto {
  users: UserMetricsDto;
  appointments: AppointmentMetricsDto;
  barbers: BarberMetricsDto;
  customers: CustomerMetricsDto;
  occupation: OccupationMetricsDto;
}
