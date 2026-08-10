import { DomainEvent } from '../../../../../shared/domain/events/domain-event';

export interface UserRoleChangedPayload {
  [key: string]: string;
  userId: string;
  previousRole: string;
  newRole: string;
}

/**
 * Not a notification trigger — no `recipientEmail`, so
 * `DispatchNotificationUseCase` no-ops on it. Exists purely so other
 * bounded contexts (see `UserRoleChangedConsumer` in the barber module)
 * can react to a role change without Identity depending on them.
 */
export class UserRoleChangedEvent implements DomainEvent<UserRoleChangedPayload> {
  readonly name = 'UserRoleChanged';
  readonly occurredAt: Date;
  readonly payload: UserRoleChangedPayload;

  constructor(payload: UserRoleChangedPayload, occurredAt: Date = new Date()) {
    this.payload = payload;
    this.occurredAt = occurredAt;
  }
}
