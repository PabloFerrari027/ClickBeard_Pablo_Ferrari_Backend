import { DomainEvent } from '../../../../../shared/domain/events/domain-event';

export interface UserLoggedInPayload {
  [key: string]: string;
  userId: string;
  name: string;
}

export class UserLoggedInEvent implements DomainEvent<UserLoggedInPayload> {
  readonly name = 'UserLoggedIn';
  readonly occurredAt: Date;
  readonly recipientEmail: string;
  readonly payload: UserLoggedInPayload;

  constructor(
    recipientEmail: string,
    payload: UserLoggedInPayload,
    occurredAt: Date = new Date(),
  ) {
    this.recipientEmail = recipientEmail;
    this.payload = payload;
    this.occurredAt = occurredAt;
  }
}
