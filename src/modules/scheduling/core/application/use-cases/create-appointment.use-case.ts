import { UserRepository } from '../../../../identity/core/application/ports/user-repository.port';
import { AppointmentTooSoonError } from '../../domain/errors/appointment-too-soon.error';
import { BarberDoesNotHaveQualificationError } from '../../domain/errors/barber-does-not-have-qualification.error';
import { BarberNotFoundError } from '../../domain/errors/barber-not-found.error';
import { BarberTimeSlotConflictError } from '../../domain/errors/barber-time-slot-conflict.error';
import { BarberUnavailableError } from '../../domain/errors/barber-unavailable.error';
import { UserNotFoundError } from '../../domain/errors/user-not-found.error';
import {
  Appointment,
  MIN_APPOINTMENT_NOTICE_MS,
} from '../../domain/entities/appointment.entity';
import { AppointmentCreatedEvent } from '../../domain/events/appointment-created.event';
import { TimeSlot } from '../../domain/value-objects/time-slot.value-object';
import {
  CreateAppointmentInputDto,
  CreateAppointmentOutputDto,
} from '../dtos/create-appointment.dto';
import { toAppointmentDto } from '../mappers/appointment.mapper';
import { AppointmentRepository } from '../ports/appointment-repository.port';
import { AvailabilityService } from '../ports/availability-service.port';
import { BarberDirectory } from '../ports/barber-directory.port';
import { TransactionManager } from '../ports/transaction-manager.port';
import { EventBus } from '../../../../../shared/application/ports/event-bus.port';
import { UseCase } from '../../../../../shared/application/use-case';

export class CreateAppointmentUseCase implements UseCase<
  CreateAppointmentInputDto,
  CreateAppointmentOutputDto
> {
  constructor(
    private readonly appointmentRepository: AppointmentRepository,
    private readonly availabilityService: AvailabilityService,
    private readonly userRepository: UserRepository,
    private readonly barberDirectory: BarberDirectory,
    private readonly transactionManager: TransactionManager,
    private readonly eventBus: EventBus,
  ) {}

  async execute(
    input: CreateAppointmentInputDto,
  ): Promise<CreateAppointmentOutputDto> {
    const customer = await this.userRepository.findById(input.customerId);

    if (!customer || !customer.isActive()) {
      throw new UserNotFoundError();
    }

    const barberProfile = await this.barberDirectory.findById(input.barberId);

    if (!barberProfile || !barberProfile.active) {
      throw new BarberNotFoundError();
    }

    if (!barberProfile.qualificationIds.includes(input.qualificationId)) {
      throw new BarberDoesNotHaveQualificationError();
    }

    const timeSlot = TimeSlot.create(input.startAt);
    const now = new Date();

    const noticeMs = timeSlot.getStart().getTime() - now.getTime();

    if (noticeMs < MIN_APPOINTMENT_NOTICE_MS) {
      throw new AppointmentTooSoonError();
    }

    const appointment = await this.transactionManager.runInTransaction(
      async () => {
        const isUnavailable =
          await this.availabilityService.isBarberUnavailable(
            input.barberId,
            timeSlot,
          );

        if (isUnavailable) {
          throw new BarberUnavailableError();
        }

        const isAvailable = await this.availabilityService.isBarberAvailable(
          input.barberId,
          timeSlot,
        );

        if (!isAvailable) {
          throw new BarberTimeSlotConflictError();
        }

        const newAppointment = Appointment.create({
          customerId: input.customerId,
          barberId: input.barberId,
          qualificationId: input.qualificationId,
          timeSlot,
          now,
        });

        await this.appointmentRepository.save(newAppointment);

        return newAppointment;
      },
    );

    await this.eventBus.publish(
      new AppointmentCreatedEvent(
        {
          appointmentId: appointment.getId(),
          customerId: appointment.getCustomerId(),
          barberId: appointment.getBarberId(),
          qualificationId: appointment.getQualificationId(),
          startAt: timeSlot.getStart().toISOString(),
        },
        now,
      ),
    );

    return { appointment: toAppointmentDto(appointment) };
  }
}
