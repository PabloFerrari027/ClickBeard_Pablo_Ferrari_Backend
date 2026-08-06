import {
  BarberAppointmentCount,
  QualificationUsageCount,
} from '../ports/barber-metrics-query.port';

export interface BarberMetricsDto {
  totalBarbers: number;
  appointmentsByBarber: BarberAppointmentCount[];
  mostRequestedBarbers: BarberAppointmentCount[];
  mostUsedQualifications: QualificationUsageCount[];
}
