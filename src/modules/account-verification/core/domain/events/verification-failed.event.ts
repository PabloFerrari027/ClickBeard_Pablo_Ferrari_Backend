import { DomainEvent } from '../../../../../shared/domain/events/domain-event';

export interface VerificationFailedPayload {
  [key: string]: string;
  userId: string;
  reason: string;
}

export class VerificationFailedEvent implements DomainEvent<VerificationFailedPayload> {
  readonly name = 'VerificationFailed';
  readonly occurredAt: Date;
  readonly payload: VerificationFailedPayload;

  constructor(payload: VerificationFailedPayload, occurredAt: Date) {
    this.payload = payload;
    this.occurredAt = occurredAt;
  }
}
