import { AppointmentDto } from './appointment.dto';

export interface ListCustomerAppointmentsInputDto {
  requesterId: string;
  page?: number;
}

export interface ListCustomerAppointmentsOutputDto {
  appointments: AppointmentDto[];
  page: number;
  totalPages: number;
}
