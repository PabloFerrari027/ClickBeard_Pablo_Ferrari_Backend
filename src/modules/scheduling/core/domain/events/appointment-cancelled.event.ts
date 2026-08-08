import { DomainEvent } from '../../../../../shared/domain/events/domain-event';

export interface AppointmentCancelledPayload {
  [key: string]: string;
  appointmentId: string;
  customerId: string;
  barberId: string;
  startAt: string;
  name: string;
}

export class AppointmentCancelledEvent implements DomainEvent<AppointmentCancelledPayload> {
  readonly name = 'AppointmentCancelled';
  readonly occurredAt: Date;
  readonly recipientEmail: string;
  readonly payload: AppointmentCancelledPayload;

  constructor(
    recipientEmail: string,
    payload: AppointmentCancelledPayload,
    occurredAt: Date = new Date(),
  ) {
    this.recipientEmail = recipientEmail;
    this.payload = payload;
    this.occurredAt = occurredAt;
  }
}
