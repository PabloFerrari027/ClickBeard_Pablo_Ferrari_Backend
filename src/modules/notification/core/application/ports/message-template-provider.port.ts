import { LanguageCode } from './language-resolver.port';

export const MESSAGE_TEMPLATE_PROVIDER = Symbol('MessageTemplateProvider');

export interface MessageTemplate {
  subject: string;
  body: string;
}

export interface MessageTemplateProvider {
  /**
   * Looks up the template for a given event name and language. Returns
   * null when there is no template for that event, meaning the event is
   * not meant to trigger a notification.
   */
  getTemplate(
    eventName: string,
    language: LanguageCode,
  ): Promise<MessageTemplate | null>;
}
