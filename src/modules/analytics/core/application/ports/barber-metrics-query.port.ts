import { TimeSlotDto } from '../../../../scheduling/core/application/dtos/time-slot.dto';
import { DateRange } from '../../domain/value-objects/date-range.value-object';

export const BARBER_METRICS_QUERY = Symbol('BarberMetricsQuery');

export interface BarberAppointmentCount {
  barberId: string;
  barberName: string;
  total: number;
}

export interface QualificationUsageCount {
  qualificationId: string;
  qualificationName: string;
  total: number;
}

export interface BarberOccupation {
  barberId: string;
  barberName: string;
  bookedSlots: number;
  availableSlots: number;
  /** bookedSlots / availableSlots, as a 0..1 ratio. */
  occupancyRate: number;
  freeTimeSlots: TimeSlotDto[];
}

/**
 * Analytics-owned read model over the Barber bounded context, enriched
 * with appointment counts that only Scheduling can provide — the
 * adapter is responsible for that join, never this module's use cases.
 */
export interface BarberMetricsQuery {
  countTotal(): Promise<number>;
  countAppointmentsByBarber(
    range: DateRange,
  ): Promise<BarberAppointmentCount[]>;
  mostRequestedBarbers(
    range: DateRange,
    limit: number,
  ): Promise<BarberAppointmentCount[]>;
  mostUsedQualifications(
    range: DateRange,
    limit: number,
  ): Promise<QualificationUsageCount[]>;
  occupancyByBarber(range: DateRange): Promise<BarberOccupation[]>;
}
