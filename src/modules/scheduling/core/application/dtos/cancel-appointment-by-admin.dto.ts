import { AppointmentDto } from './appointment.dto';

export interface CancelAppointmentByAdminInputDto {
  appointmentId: string;
  requesterId: string;
  reason: string;
}

export interface CancelAppointmentByAdminOutputDto {
  appointment: AppointmentDto;
}
