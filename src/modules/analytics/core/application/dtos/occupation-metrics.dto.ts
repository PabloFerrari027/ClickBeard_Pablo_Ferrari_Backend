import { BarberOccupation } from '../ports/barber-metrics-query.port';

export interface OccupationMetricsDto {
  occupancyByBarber: BarberOccupation[];
  /** Mean of occupancyByBarber[].occupancyRate, as a 0..1 ratio. */
  averageOccupancyRate: number;
}
