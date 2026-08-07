import { DomainEvent } from '../../../../../shared/domain/events/domain-event';

export interface BarberUnavailabilityCreatedPayload {
  [key: string]: string;
  unavailabilityId: string;
  barberId: string;
  startAt: string;
  endAt: string;
  reason: string;
}

export class BarberUnavailabilityCreatedEvent implements DomainEvent<BarberUnavailabilityCreatedPayload> {
  readonly name = 'BarberUnavailabilityCreated';
  readonly occurredAt: Date;
  readonly payload: BarberUnavailabilityCreatedPayload;

  constructor(payload: BarberUnavailabilityCreatedPayload, occurredAt: Date) {
    this.payload = payload;
    this.occurredAt = occurredAt;
  }
}
