import { DomainEvent } from '../../../../../shared/domain/events/domain-event';

export interface VerificationCodeGeneratedPayload {
  [key: string]: string;
  name: string;
  code: string;
}

export class VerificationCodeGeneratedEvent implements DomainEvent<VerificationCodeGeneratedPayload> {
  readonly name = 'VerificationCodeGenerated';
  readonly occurredAt: Date;
  readonly recipientEmail: string;
  readonly payload: VerificationCodeGeneratedPayload;

  constructor(
    recipientEmail: string,
    payload: VerificationCodeGeneratedPayload,
    occurredAt: Date,
  ) {
    this.recipientEmail = recipientEmail;
    this.payload = payload;
    this.occurredAt = occurredAt;
  }
}
