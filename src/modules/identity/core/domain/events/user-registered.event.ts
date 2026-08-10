import { DomainEvent } from '../../../../../shared/domain/events/domain-event';

export interface UserRegisteredPayload {
  [key: string]: string;
  userId: string;
  name: string;
}

export class UserRegisteredEvent implements DomainEvent<UserRegisteredPayload> {
  readonly name = 'UserRegistered';
  readonly occurredAt: Date;
  readonly recipientEmail: string;
  readonly payload: UserRegisteredPayload;

  constructor(
    recipientEmail: string,
    payload: UserRegisteredPayload,
    occurredAt: Date = new Date(),
  ) {
    this.recipientEmail = recipientEmail;
    this.payload = payload;
    this.occurredAt = occurredAt;
  }
}
