import { BarberMetricsDto } from './barber-metrics.dto';
import { DateRangeFilterDto } from './date-range-filter.dto';

export interface GetBarberMetricsInputDto {
  requesterId: string;
  filter: DateRangeFilterDto;
}

export interface GetBarberMetricsOutputDto {
  metrics: BarberMetricsDto;
}
