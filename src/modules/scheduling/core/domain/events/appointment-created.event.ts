import { DomainEvent } from '../../../../../shared/domain/events/domain-event';

export interface AppointmentCreatedPayload {
  [key: string]: string;
  appointmentId: string;
  customerId: string;
  barberId: string;
  qualificationId: string;
  startAt: string;
}

export class AppointmentCreatedEvent implements DomainEvent<AppointmentCreatedPayload> {
  readonly name = 'AppointmentCreated';
  readonly occurredAt: Date;
  readonly payload: AppointmentCreatedPayload;

  constructor(payload: AppointmentCreatedPayload, occurredAt: Date) {
    this.payload = payload;
    this.occurredAt = occurredAt;
  }
}
