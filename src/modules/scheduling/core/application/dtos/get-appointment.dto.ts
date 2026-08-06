import { AppointmentDto } from './appointment.dto';

export interface GetAppointmentInputDto {
  appointmentId: string;
  requesterId: string;
}

export interface GetAppointmentOutputDto {
  appointment: AppointmentDto;
}
