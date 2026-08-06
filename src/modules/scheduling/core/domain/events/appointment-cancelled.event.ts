import { DomainEvent } from '../../../../../shared/domain/events/domain-event';

export interface AppointmentCancelledPayload {
  [key: string]: string;
  appointmentId: string;
  customerId: string;
  barberId: string;
  startAt: string;
}

export class AppointmentCancelledEvent implements DomainEvent<AppointmentCancelledPayload> {
  readonly name = 'AppointmentCancelled';
  readonly occurredAt: Date;
  readonly payload: AppointmentCancelledPayload;

  constructor(payload: AppointmentCancelledPayload, occurredAt: Date) {
    this.payload = payload;
    this.occurredAt = occurredAt;
  }
}
