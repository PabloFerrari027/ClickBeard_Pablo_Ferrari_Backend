import {
  NotificationSender,
  OutgoingNotification,
} from '../../src/modules/notification/core/application/ports/notification-sender.port';

/**
 * Replaces the real SMTP sender in e2e tests via `overrideProvider`. The
 * only way to obtain a raw verification code is to intercept it here —
 * it is bcrypt-hashed as soon as it reaches the database.
 */
export class NotificationSenderSpy implements NotificationSender {
  private readonly sent: OutgoingNotification[] = [];

  send(notification: OutgoingNotification): Promise<void> {
    this.sent.push(notification);
    return Promise.resolve();
  }

  /**
   * Polls instead of awaiting an event, since generation happens on a
   * real BullMQ worker asynchronously after the triggering HTTP request
   * has already responded.
   */
  async waitFor(
    predicate: (notification: OutgoingNotification) => boolean,
    {
      timeoutMs = 10_000,
      intervalMs = 100,
    }: { timeoutMs?: number; intervalMs?: number } = {},
  ): Promise<OutgoingNotification> {
    const deadline = Date.now() + timeoutMs;

    for (;;) {
      const match = this.sent.find(predicate);

      if (match) {
        return match;
      }

      if (Date.now() >= deadline) {
        throw new Error(
          `Timed out after ${timeoutMs}ms waiting for a matching notification. Sent so far: ${JSON.stringify(this.sent)}`,
        );
      }

      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
  }
}
