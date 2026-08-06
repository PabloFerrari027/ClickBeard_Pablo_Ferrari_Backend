import { CustomerAppointmentCount } from '../ports/customer-metrics-query.port';

export interface CustomerMetricsDto {
  topCustomersByAppointments: CustomerAppointmentCount[];
  activeCustomers: number;
  inactiveCustomers: number;
}
