import { DashboardMetricsDto } from './dashboard-metrics.dto';
import { DateRangeFilterDto } from './date-range-filter.dto';

export interface GetDashboardMetricsInputDto {
  requesterId: string;
  filter: DateRangeFilterDto;
}

export interface GetDashboardMetricsOutputDto {
  metrics: DashboardMetricsDto;
}
