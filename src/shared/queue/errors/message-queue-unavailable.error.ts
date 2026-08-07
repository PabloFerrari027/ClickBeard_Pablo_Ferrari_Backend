/**
 * Thrown when the underlying queue technology (Redis/BullMQ) cannot be
 * reached. Unlike a cache miss, a failed publish/enqueue has real
 * business meaning (a domain event, e.g. a notification trigger, would
 * silently never be delivered), so this propagates rather than being
 * swallowed — callers already `await eventBus.publish(...)` expecting
 * it to either succeed or fail loudly.
 */
export class MessageQueueUnavailableError extends Error {
  constructor(cause?: unknown) {
    super('The message queue is currently unavailable.', { cause });
    this.name = new.target.name;
  }
}
