import { Appointment } from '../../domain/entities/appointment.entity';

export const APPOINTMENT_REPOSITORY = Symbol('AppointmentRepository');

export interface PaginatedAppointments {
  appointments: Appointment[];
  total: number;
}

export interface AppointmentRepository {
  /**
   * The adapter must enforce a uniqueness constraint on (barberId,
   * startAt) for non-cancelled appointments — that's the actual
   * guarantee against double-booking under concurrent requests, not
   * just the pre-check in CreateAppointmentUseCase. A violation should
   * surface as BarberTimeSlotConflictError.
   */
  save(appointment: Appointment): Promise<void>;
  findById(id: string): Promise<Appointment | null>;
  findByCustomerId(
    customerId: string,
    page: number,
    limit: number,
  ): Promise<PaginatedAppointments>;
  /** All appointments whose time slot falls on the given calendar day. */
  findByDate(
    date: Date,
    page: number,
    limit: number,
  ): Promise<PaginatedAppointments>;
  /** All appointments starting at or after the given instant. */
  findUpcoming(
    from: Date,
    page: number,
    limit: number,
  ): Promise<PaginatedAppointments>;
}
