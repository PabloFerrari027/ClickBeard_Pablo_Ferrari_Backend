export const NOTIFICATION_SENDER = Symbol('NotificationSender');

export interface OutgoingNotification {
  recipient: string;
  subject: string;
  body: string;
}

export interface NotificationSender {
  send(notification: OutgoingNotification): Promise<void>;
}
