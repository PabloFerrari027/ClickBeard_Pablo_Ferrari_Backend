import { DateRange } from '../../domain/value-objects/date-range.value-object';

export const CUSTOMER_METRICS_QUERY = Symbol('CustomerMetricsQuery');

export interface CustomerAppointmentCount {
  customerId: string;
  customerName: string;
  total: number;
}

export interface CustomerLastAppointment {
  customerId: string;
  customerName: string;
  lastAppointmentAt: Date | null;
}

/**
 * Analytics-owned read model over Identity's customers, enriched with
 * appointment activity from Scheduling.
 */
export interface CustomerMetricsQuery {
  topCustomersByAppointments(
    range: DateRange,
    limit: number,
  ): Promise<CustomerAppointmentCount[]>;
  /** Customers (role CLIENT) with at least one appointment in the range. */
  countActiveCustomers(range: DateRange): Promise<number>;
  /** Customers (role CLIENT) with no appointment in the range. */
  countInactiveCustomers(range: DateRange): Promise<number>;
  findLastAppointmentByCustomer(
    customerId: string,
  ): Promise<CustomerLastAppointment | null>;
}
