/**
 * Common shape every domain event must satisfy so that a single EventBus
 * can carry events published by any module to any consumer, without those
 * modules depending on each other's concrete event classes.
 */
export interface DomainEvent<
  Payload extends Record<string, string> = Record<string, string>,
> {
  readonly name: string;
  readonly occurredAt: Date;
  readonly recipientEmail?: string;
  readonly payload: Payload;
}
