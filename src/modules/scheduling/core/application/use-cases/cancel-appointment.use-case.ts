import { UserRepository } from '../../../../identity/core/application/ports/user-repository.port';
import { AppointmentAccessDeniedError } from '../../domain/errors/appointment-access-denied.error';
import { AppointmentNotFoundError } from '../../domain/errors/appointment-not-found.error';
import { UserNotFoundError } from '../../domain/errors/user-not-found.error';
import { AppointmentCancelledEvent } from '../../domain/events/appointment-cancelled.event';
import {
  CancelAppointmentInputDto,
  CancelAppointmentOutputDto,
} from '../dtos/cancel-appointment.dto';
import { toAppointmentDto } from '../mappers/appointment.mapper';
import { AppointmentRepository } from '../ports/appointment-repository.port';
import { EventBus } from '../../../../../shared/application/ports/event-bus.port';
import { UseCase } from '../../../../../shared/application/use-case';

export class CancelAppointmentUseCase implements UseCase<
  CancelAppointmentInputDto,
  CancelAppointmentOutputDto
> {
  constructor(
    private readonly appointmentRepository: AppointmentRepository,
    private readonly userRepository: UserRepository,
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

    const customer = await this.userRepository.findById(
      appointment.getCustomerId(),
    );

    if (!customer) {
      throw new UserNotFoundError();
    }

    const now = new Date();

    appointment.cancel(now);

    await this.appointmentRepository.save(appointment);

    await this.eventBus.publish(
      new AppointmentCancelledEvent(
        customer.getEmail().getValue(),
        {
          appointmentId: appointment.getId(),
          customerId: appointment.getCustomerId(),
          barberId: appointment.getBarberId(),
          startAt: appointment.getTimeSlot().getStart().toISOString(),
          name: customer.getName(),
        },
        now,
      ),
    );

    return { appointment: toAppointmentDto(appointment) };
  }
}
