import { Appointment } from '../../domain/entities/appointment.entity';
import { AppointmentDto } from '../dtos/appointment.dto';

export function toAppointmentDto(appointment: Appointment): AppointmentDto {
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
