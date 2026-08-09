import { AppointmentDto } from './appointment.dto';

export interface ListFutureAppointmentsInputDto {
  requesterId: string;
  page?: number;
  /** Narrows the listing to appointments starting at or after this instant; still bounded below by "now" (see the use case). */
  startAt?: Date;
  /** Narrows the listing to appointments starting at or before this instant. */
  endAt?: Date;
}

export interface ListFutureAppointmentsOutputDto {
  appointments: AppointmentDto[];
  page: number;
  totalPages: number;
}
