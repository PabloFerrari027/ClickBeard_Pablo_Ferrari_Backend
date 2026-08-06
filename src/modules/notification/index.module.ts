import { Module } from '@nestjs/common';

import { LANGUAGE_RESOLVER } from './core/application/ports/language-resolver.port';
import { MESSAGE_TEMPLATE_PROVIDER } from './core/application/ports/message-template-provider.port';
import { NOTIFICATION_SENDER } from './core/application/ports/notification-sender.port';
import { DispatchNotificationUseCase } from './core/application/use-cases/dispatch-notification.use-case';

import type { LanguageResolver } from './core/application/ports/language-resolver.port';
import type { MessageTemplateProvider } from './core/application/ports/message-template-provider.port';
import type { NotificationSender } from './core/application/ports/notification-sender.port';

@Module({
  providers: [
    {
      provide: DispatchNotificationUseCase,
      useFactory: (
        languageResolver: LanguageResolver,
        templateProvider: MessageTemplateProvider,
        notificationSender: NotificationSender,
      ) =>
        new DispatchNotificationUseCase(
          languageResolver,
          templateProvider,
          notificationSender,
        ),
      inject: [
        LANGUAGE_RESOLVER,
        MESSAGE_TEMPLATE_PROVIDER,
        NOTIFICATION_SENDER,
      ],
    },
  ],
})
export class NotificationModule {}
