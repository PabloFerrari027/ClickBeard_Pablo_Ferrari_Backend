import { AppointmentMetricsDto } from './appointment-metrics.dto';
import { DateRangeFilterDto } from './date-range-filter.dto';

export interface GetAppointmentMetricsInputDto {
  requesterId: string;
  filter: DateRangeFilterDto;
}

export interface GetAppointmentMetricsOutputDto {
  metrics: AppointmentMetricsDto;
}
