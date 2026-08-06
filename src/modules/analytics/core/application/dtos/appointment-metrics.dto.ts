import {
  DayOfWeekUsage,
  TimeSlotUsage,
} from '../ports/appointment-metrics-query.port';

export interface AppointmentMetricsDto {
  totalAppointments: number;
  appointmentsToday: number;
  appointmentsThisWeek: number;
  appointmentsThisMonth: number;
  appointmentsInPeriod: number;
  futureAppointments: number;
  cancelledAppointments: number;
  cancellationRate: number;
  mostUsedTimeSlots: TimeSlotUsage[];
  busiestDaysOfWeek: DayOfWeekUsage[];
}
