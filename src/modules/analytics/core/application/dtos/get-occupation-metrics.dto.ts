import { DateRangeFilterDto } from './date-range-filter.dto';
import { OccupationMetricsDto } from './occupation-metrics.dto';

export interface GetOccupationMetricsInputDto {
  requesterId: string;
  filter: DateRangeFilterDto;
}

export interface GetOccupationMetricsOutputDto {
  metrics: OccupationMetricsDto;
}
