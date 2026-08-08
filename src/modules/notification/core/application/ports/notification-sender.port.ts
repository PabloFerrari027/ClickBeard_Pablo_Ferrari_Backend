import { LanguageCode } from './language-resolver.port';

export const NOTIFICATION_SENDER = Symbol('NotificationSender');

export interface OutgoingNotification {
  recipient: string;
  subject: string;
  body: string;
  /** The language the subject/body were rendered in, so senders that support
   *  rich formatting (e.g. HTML email) can localize chrome around the
   *  message (footers, disclaimers) to match. */
  language: LanguageCode;
}

export interface NotificationSender {
  send(notification: OutgoingNotification): Promise<void>;
}
