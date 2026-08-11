import { AppointmentDto } from './appointment.dto';

export interface CancelAppointmentsForBarberUnavailabilityInputDto {
  barberId: string;
  startAt: Date;
  endAt: Date;
  reason: string;
}

export interface CancelAppointmentsForBarberUnavailabilityOutputDto {
  cancelledCount: number;
  cancelledAppointments: AppointmentDto[];
}
