import { DomainEvent } from '../../../../../shared/domain/events/domain-event';

export interface AppointmentCancelledByAdminPayload {
  [key: string]: string;
  appointmentId: string;
  customerId: string;
  barberId: string;
  startAt: string;
  reason: string;
  name: string;
}

export class AppointmentCancelledByAdminEvent implements DomainEvent<AppointmentCancelledByAdminPayload> {
  readonly name = 'AppointmentCancelledByAdmin';
  readonly occurredAt: Date;
  readonly recipientEmail: string;
  readonly payload: AppointmentCancelledByAdminPayload;

  constructor(
    recipientEmail: string,
    payload: AppointmentCancelledByAdminPayload,
    occurredAt: Date = new Date(),
  ) {
    this.recipientEmail = recipientEmail;
    this.payload = payload;
    this.occurredAt = occurredAt;
  }
}
