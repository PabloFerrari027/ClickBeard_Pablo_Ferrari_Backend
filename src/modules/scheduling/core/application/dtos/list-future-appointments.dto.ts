import { AppointmentDto } from './appointment.dto';

export interface ListFutureAppointmentsInputDto {
  requesterId: string;
  page?: number;
}

export interface ListFutureAppointmentsOutputDto {
  appointments: AppointmentDto[];
  page: number;
  totalPages: number;
}
