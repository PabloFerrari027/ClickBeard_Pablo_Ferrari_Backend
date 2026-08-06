import { AppointmentDto } from './appointment.dto';

export interface CancelAppointmentInputDto {
  appointmentId: string;
  customerId: string;
}

export interface CancelAppointmentOutputDto {
  appointment: AppointmentDto;
}
