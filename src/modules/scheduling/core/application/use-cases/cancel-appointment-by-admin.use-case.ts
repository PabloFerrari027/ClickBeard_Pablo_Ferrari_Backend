import { UserRepository } from '../../../../identity/core/application/ports/user-repository.port';
import { AppointmentNotFoundError } from '../../domain/errors/appointment-not-found.error';
import { UserNotFoundError } from '../../domain/errors/user-not-found.error';
import { AppointmentCancelledByAdminEvent } from '../../domain/events/appointment-cancelled-by-admin.event';
import { formatBusinessDateTime } from '../../domain/value-objects/time-slot.value-object';
import {
  CancelAppointmentByAdminInputDto,
  CancelAppointmentByAdminOutputDto,
} from '../dtos/cancel-appointment-by-admin.dto';
import { toAppointmentDto } from '../mappers/appointment.mapper';
import { ensureRequesterIsAdmin } from '../policies/ensure-requester-is-admin.policy';
import { AppointmentRepository } from '../ports/appointment-repository.port';
import { EventBus } from '../../../../../shared/application/ports/event-bus.port';
import { UseCase } from '../../../../../shared/application/use-case';

export class CancelAppointmentByAdminUseCase implements UseCase<
  CancelAppointmentByAdminInputDto,
  CancelAppointmentByAdminOutputDto
> {
  constructor(
    private readonly appointmentRepository: AppointmentRepository,
    private readonly userRepository: UserRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(
    input: CancelAppointmentByAdminInputDto,
  ): Promise<CancelAppointmentByAdminOutputDto> {
    await ensureRequesterIsAdmin(this.userRepository, input.requesterId);

    const appointment = await this.appointmentRepository.findById(
      input.appointmentId,
    );

    if (!appointment) {
      throw new AppointmentNotFoundError();
    }

    const customer = await this.userRepository.findById(
      appointment.getCustomerId(),
    );

    if (!customer) {
      throw new UserNotFoundError();
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
          startAt: formatBusinessDateTime(appointment.getTimeSlot().getStart()),
          reason: appointment.getCancellationReason() as string,
          name: customer.getName(),
        },
        now,
      ),
    );

    return { appointment: toAppointmentDto(appointment) };
  }
}
