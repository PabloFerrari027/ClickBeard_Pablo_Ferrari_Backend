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

  /** Snapshot to pass as `waitFor`'s `since` option before triggering an action. */
  count(): number {
    return this.sent.length;
  }

  /**
   * Polls instead of awaiting an event, since generation happens on a
   * real BullMQ worker asynchronously after the triggering HTTP request
   * has already responded.
   *
   * `since` (typically `notifications.count()` captured right before the
   * action under test) restricts matches to notifications sent from that
   * point on. This matters because registration and login can each
   * independently trigger a verification code email to the same address
   * (registration no longer waits for a first login — see
   * `VerificationCodeRequestConsumer`), each invalidating the previous
   * code — without `since`, a poll could match the older, now-invalid
   * one the instant it lands, before the newer one the caller actually
   * wants has even been generated (account-verification and
   * notifications run on independent BullMQ workers, so there's no
   * ordering guarantee between "older email visible" and "newer
   * generation finished").
   */
  async waitFor(
    predicate: (notification: OutgoingNotification) => boolean,
    {
      timeoutMs = 10_000,
      intervalMs = 100,
      since = 0,
    }: { timeoutMs?: number; intervalMs?: number; since?: number } = {},
  ): Promise<OutgoingNotification> {
    const deadline = Date.now() + timeoutMs;

    for (;;) {
      const match = this.sent.slice(since).find(predicate);

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
