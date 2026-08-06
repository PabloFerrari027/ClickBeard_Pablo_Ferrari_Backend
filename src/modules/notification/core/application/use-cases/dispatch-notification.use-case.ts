import { formatMessage } from '../formatters/message-formatter';
import { LanguageResolver } from '../ports/language-resolver.port';
import { MessageTemplateProvider } from '../ports/message-template-provider.port';
import { NotificationSender } from '../ports/notification-sender.port';
import { DomainEvent } from '../../../../../shared/domain/events/domain-event';
import { UseCase } from '../../../../../shared/application/use-case';

/**
 * The single, reusable entry point for turning any domain event into a
 * sent notification. Business modules never call this directly — a
 * future queue consumer invokes it for each event it dequeues, which is
 * what keeps every notification (welcome email, password-changed email,
 * verification-code email, and any future one) on the same pipeline.
 */
export class DispatchNotificationUseCase implements UseCase<DomainEvent, void> {
  constructor(
    private readonly languageResolver: LanguageResolver,
    private readonly templateProvider: MessageTemplateProvider,
    private readonly notificationSender: NotificationSender,
  ) {}

  async execute(event: DomainEvent): Promise<void> {
    if (!event.recipientEmail) {
      return;
    }

    const language = await this.languageResolver.resolve(event.recipientEmail);
    const template = await this.templateProvider.getTemplate(
      event.name,
      language,
    );

    if (!template) {
      return;
    }

    const { subject, body } = formatMessage(template, event.payload);

    await this.notificationSender.send({
      recipient: event.recipientEmail,
      subject,
      body,
    });
  }
}
