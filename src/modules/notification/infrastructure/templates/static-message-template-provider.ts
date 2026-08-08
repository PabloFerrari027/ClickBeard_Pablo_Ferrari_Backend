import { Injectable } from '@nestjs/common';

import {
  DEFAULT_LANGUAGE,
  LanguageCode,
} from '../../core/application/ports/language-resolver.port';
import {
  MessageTemplate,
  MessageTemplateProvider,
} from '../../core/application/ports/message-template-provider.port';

type TemplatesByLanguage = Record<LanguageCode, MessageTemplate>;

/**
 * Keyed by domain event name, then language, so adding a template for a
 * new event or language never touches `DispatchNotificationUseCase` or
 * any use case that publishes events — only this map. Events with no
 * entry here (e.g. `AppointmentCreated`, which carries no
 * `recipientEmail`) simply never reach this provider.
 */
const TEMPLATES: Record<string, TemplatesByLanguage> = {
  UserRegistered: {
    [DEFAULT_LANGUAGE]: {
      subject: 'Welcome to ClickBeard, {{name}}!',
      body: 'Hi {{name}}, thanks for signing up. We are glad to have you.',
    },
  },
  PasswordChanged: {
    [DEFAULT_LANGUAGE]: {
      subject: 'Your ClickBeard password was changed',
      body: 'Hi {{name}}, your password was just changed. If this was not you, please contact support immediately.',
    },
  },
  VerificationCodeGenerated: {
    [DEFAULT_LANGUAGE]: {
      subject: 'Your ClickBeard verification code',
      body: 'Hi {{name}}, your verification code is {{code}}. It expires in 10 minutes.',
    },
  },
  UserLoggedIn: {
    [DEFAULT_LANGUAGE]: {
      subject: 'New sign-in to your ClickBeard account',
      body: 'Hi {{name}}, we noticed a new sign-in to your account. If this was not you, please contact support.',
    },
  },
  AppointmentCancelledByAdmin: {
    [DEFAULT_LANGUAGE]: {
      subject: 'Your ClickBeard appointment was cancelled',
      body: 'Hi {{name}}, your appointment was cancelled. Reason: {{reason}}. We are sorry for the inconvenience.',
    },
  },
};

@Injectable()
export class StaticMessageTemplateProvider implements MessageTemplateProvider {
  getTemplate(
    eventName: string,
    language: LanguageCode,
  ): Promise<MessageTemplate | null> {
    const templatesForEvent = TEMPLATES[eventName];

    if (!templatesForEvent) {
      return Promise.resolve(null);
    }

    return Promise.resolve(
      templatesForEvent[language] ??
        templatesForEvent[DEFAULT_LANGUAGE] ??
        null,
    );
  }
}
