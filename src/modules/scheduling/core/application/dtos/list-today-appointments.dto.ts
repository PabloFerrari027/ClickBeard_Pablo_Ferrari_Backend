import { AppointmentDto } from './appointment.dto';

export interface ListTodayAppointmentsInputDto {
  requesterId: string;
  page?: number;
}

export interface ListTodayAppointmentsOutputDto {
  appointments: AppointmentDto[];
  page: number;
  totalPages: number;
}
