import { CustomerMetricsDto } from './customer-metrics.dto';
import { DateRangeFilterDto } from './date-range-filter.dto';
import { CustomerLastAppointment } from '../ports/customer-metrics-query.port';

export interface GetCustomerMetricsInputDto {
  requesterId: string;
  filter: DateRangeFilterDto;
  /** When provided, includes that customer's last appointment in the output. */
  customerId?: string;
}

export interface GetCustomerMetricsOutputDto {
  metrics: CustomerMetricsDto;
  lastAppointment?: CustomerLastAppointment | null;
}
