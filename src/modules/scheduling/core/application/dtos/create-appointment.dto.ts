import { AppointmentDto } from './appointment.dto';

export interface CreateAppointmentInputDto {
  customerId: string;
  barberId: string;
  qualificationId: string;
  startAt: Date;
}

export interface CreateAppointmentOutputDto {
  appointment: AppointmentDto;
}
