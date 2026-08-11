import { UserRepository } from '../../../../identity/core/application/ports/user-repository.port';
import { AppointmentCancelledByAdminEvent } from '../../domain/events/appointment-cancelled-by-admin.event';
import { AppointmentDto } from '../dtos/appointment.dto';
import {
  CancelAppointmentsForBarberUnavailabilityInputDto,
  CancelAppointmentsForBarberUnavailabilityOutputDto,
} from '../dtos/cancel-appointments-for-barber-unavailability.dto';
import { toAppointmentDto } from '../mappers/appointment.mapper';
import { AppointmentRepository } from '../ports/appointment-repository.port';
import { EventBus } from '../../../../../shared/application/ports/event-bus.port';
import { UseCase } from '../../../../../shared/application/use-case';

/**
 * Not exposed via any HTTP route — invoked only by
 * BarberUnavailabilityCreatedConsumer, reacting to a `barber` module
 * event. Reuses Appointment.cancelByAdmin and AppointmentCancelledByAdmin
 * (see CancelAppointmentByAdminUseCase) so each affected customer gets
 * the exact same cancellation-with-reason email a direct admin
 * cancellation would produce.
 */
export class CancelAppointmentsForBarberUnavailabilityUseCase implements UseCase<
  CancelAppointmentsForBarberUnavailabilityInputDto,
  CancelAppointmentsForBarberUnavailabilityOutputDto
> {
  constructor(
    private readonly appointmentRepository: AppointmentRepository,
    private readonly userRepository: UserRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(
    input: CancelAppointmentsForBarberUnavailabilityInputDto,
  ): Promise<CancelAppointmentsForBarberUnavailabilityOutputDto> {
    const appointments =
      await this.appointmentRepository.findScheduledByBarberAndRange(
        input.barberId,
        input.startAt,
        input.endAt,
      );

    const cancelledAppointments: AppointmentDto[] = [];

    for (const appointment of appointments) {
      const customer = await this.userRepository.findById(
        appointment.getCustomerId(),
      );

      if (!customer) {
        continue;
      }

      const now = new Date();

      appointment.cancelByAdmin(now, input.reason);

      await this.appointmentRepository.save(appointment);

      await this.eventBus.publish(
        new AppointmentCancelledByAdminEvent(
          customer.getEmail().getValue(),
          {
            appointmentId: appointment.getId(),
            customerId: appointment.getCustomerId(),
            barberId: appointment.getBarberId(),
            startAt: appointment.getTimeSlot().getStart().toISOString(),
            reason: appointment.getCancellationReason() as string,
            name: customer.getName(),
          },
          now,
        ),
      );

      cancelledAppointments.push(toAppointmentDto(appointment));
    }

    return {
      cancelledCount: cancelledAppointments.length,
      cancelledAppointments,
    };
  }
}
