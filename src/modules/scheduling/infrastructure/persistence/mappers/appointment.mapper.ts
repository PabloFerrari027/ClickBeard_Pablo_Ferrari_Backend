import { Appointment } from '../../../core/domain/entities/appointment.entity';
import { TimeSlot } from '../../../core/domain/value-objects/time-slot.value-object';
import {
  AppointmentModel,
  AppointmentModelAttributes,
} from '../models/appointment.model';

export function toAppointmentPersistence(
  appointment: Appointment,
): AppointmentModelAttributes {
  return {
    id: appointment.getId(),
    customerId: appointment.getCustomerId(),
    barberId: appointment.getBarberId(),
    qualificationId: appointment.getQualificationId(),
    startAt: appointment.getTimeSlot().getStart(),
    endAt: appointment.getTimeSlot().getEnd(),
    status: appointment.getStatus(),
    createdAt: appointment.getCreatedAt(),
    updatedAt: appointment.getUpdatedAt(),
    cancelledAt: appointment.getCancelledAt(),
    cancellationReason: appointment.getCancellationReason(),
  };
}

export function toAppointmentDomain(model: AppointmentModel): Appointment {
  return Appointment.restore({
    id: model.id,
    customerId: model.customerId,
    barberId: model.barberId,
    qualificationId: model.qualificationId,
    timeSlot: TimeSlot.restore(model.startAt, model.endAt),
    status: model.status,
    createdAt: model.createdAt,
    updatedAt: model.updatedAt,
    cancelledAt: model.cancelledAt,
    cancellationReason: model.cancellationReason,
  });
}
