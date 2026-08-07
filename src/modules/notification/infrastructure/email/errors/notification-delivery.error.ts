/**
 * Wraps any SMTP/transport failure so no library-specific error shape
 * ever crosses out of this adapter.
 */
export class NotificationDeliveryError extends Error {
  constructor(cause?: unknown) {
    super('Failed to send the notification.', { cause });
    this.name = new.target.name;
  }
}
