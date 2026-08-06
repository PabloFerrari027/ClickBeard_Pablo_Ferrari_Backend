import { DateRangeFilterDto } from './date-range-filter.dto';
import { UserMetricsDto } from './user-metrics.dto';

export interface GetUserMetricsInputDto {
  requesterId: string;
  filter: DateRangeFilterDto;
}

export interface GetUserMetricsOutputDto {
  metrics: UserMetricsDto;
}
