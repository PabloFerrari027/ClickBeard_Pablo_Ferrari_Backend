import { DomainEvent } from '../../../../../shared/domain/events/domain-event';

export interface PasswordChangedPayload {
  [key: string]: string;
  name: string;
}

export class PasswordChangedEvent implements DomainEvent<PasswordChangedPayload> {
  readonly name = 'PasswordChanged';
  readonly occurredAt: Date;
  readonly recipientEmail: string;
  readonly payload: PasswordChangedPayload;

  constructor(
    recipientEmail: string,
    payload: PasswordChangedPayload,
    occurredAt: Date = new Date(),
  ) {
    this.recipientEmail = recipientEmail;
    this.payload = payload;
    this.occurredAt = occurredAt;
  }
}
