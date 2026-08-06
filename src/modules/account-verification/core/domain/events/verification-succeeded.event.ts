import { DomainEvent } from '../../../../../shared/domain/events/domain-event';

export interface VerificationSucceededPayload {
  [key: string]: string;
  userId: string;
}

export class VerificationSucceededEvent implements DomainEvent<VerificationSucceededPayload> {
  readonly name = 'VerificationSucceeded';
  readonly occurredAt: Date;
  readonly payload: VerificationSucceededPayload;

  constructor(payload: VerificationSucceededPayload, occurredAt: Date) {
    this.payload = payload;
    this.occurredAt = occurredAt;
  }
}
