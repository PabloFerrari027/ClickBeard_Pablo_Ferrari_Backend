import { DomainEvent } from '../../domain/events/domain-event';

export const EVENT_BUS = Symbol('EventBus');

/**
 * The only event-related dependency business use cases take. Publishing
 * through this port is how modules notify the rest of the system without
 * ever calling another module or sending a notification directly.
 */
export interface EventBus {
  publish<Payload extends Record<string, string>>(
    event: DomainEvent<Payload>,
  ): Promise<void>;
}
