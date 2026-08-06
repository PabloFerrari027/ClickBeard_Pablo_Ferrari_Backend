import { AppointmentDto } from './appointment.dto';

export interface ListCustomerAppointmentsInputDto {
  customerId: string;
  page?: number;
}

export interface ListCustomerAppointmentsOutputDto {
  appointments: AppointmentDto[];
  page: number;
  totalPages: number;
}
