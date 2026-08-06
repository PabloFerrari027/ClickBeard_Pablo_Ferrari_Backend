import { DomainEvent } from '../../../../../shared/domain/events/domain-event';
import { UseCase } from '../../../../../shared/application/use-case';

/**
 * The seam a future queue consumer (infrastructure, not implemented here)
 * invokes for each domain event it dequeues. It is intentionally just the
 * project's existing UseCase contract applied to a DomainEvent input,
 * rather than a parallel abstraction — DispatchNotificationUseCase
 * satisfies it structurally.
 */
export type NotificationDispatcher = UseCase<DomainEvent, void>;
