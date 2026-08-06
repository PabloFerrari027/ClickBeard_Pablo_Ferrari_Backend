import { AppointmentAccessDeniedError } from '../../domain/errors/appointment-access-denied.error';
import { AppointmentNotFoundError } from '../../domain/errors/appointment-not-found.error';
import { AppointmentCancelledEvent } from '../../domain/events/appointment-cancelled.event';
import {
  CancelAppointmentInputDto,
  CancelAppointmentOutputDto,
} from '../dtos/cancel-appointment.dto';
import { toAppointmentDto } from '../mappers/appointment.mapper';
import { AppointmentRepository } from '../ports/appointment-repository.port';
import { Clock } from '../../../../../shared/application/ports/clock.port';
import { EventBus } from '../../../../../shared/application/ports/event-bus.port';
import { UseCase } from '../../../../../shared/application/use-case';

export class CancelAppointmentUseCase implements UseCase<
  CancelAppointmentInputDto,
  CancelAppointmentOutputDto
> {
  constructor(
    private readonly appointmentRepository: AppointmentRepository,
    private readonly clock: Clock,
    private readonly eventBus: EventBus,
  ) {}

  async execute(
    input: CancelAppointmentInputDto,
  ): Promise<CancelAppointmentOutputDto> {
    const appointment = await this.appointmentRepository.findById(
      input.appointmentId,
    );

    if (!appointment) {
      throw new AppointmentNotFoundError();
    }

    if (appointment.getCustomerId() !== input.customerId) {
      throw new AppointmentAccessDeniedError();
    }

    const now = this.clock.now();

    appointment.cancel(now);

    await this.appointmentRepository.save(appointment);

    await this.eventBus.publish(
      new AppointmentCancelledEvent(
        {
          appointmentId: appointment.getId(),
          customerId: appointment.getCustomerId(),
          barberId: appointment.getBarberId(),
          startAt: appointment.getTimeSlot().getStart().toISOString(),
        },
        now,
      ),
    );

    return { appointment: toAppointmentDto(appointment) };
  }
}
