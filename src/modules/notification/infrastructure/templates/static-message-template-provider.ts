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
    en: {
      subject: 'Welcome to ClickBeard, {{name}}',
      body:
        'Hello, {{name}},\n\n' +
        'Your ClickBeard account has been created successfully. You can now book appointments with our barbers and manage your upcoming visits from your account.\n\n' +
        'If you have any questions, our support team is ready to help.\n\n' +
        'Best regards,\n' +
        'The ClickBeard Team',
    },
    'pt-BR': {
      subject: 'Bem-vindo à ClickBeard, {{name}}',
      body:
        'Olá, {{name}},\n\n' +
        'Sua conta na ClickBeard foi criada com sucesso. Agora você já pode agendar horários com nossos barbeiros e acompanhar seus atendimentos pela sua conta.\n\n' +
        'Se tiver alguma dúvida, nossa equipe de suporte está à disposição.\n\n' +
        'Atenciosamente,\n' +
        'Equipe ClickBeard',
    },
  },
  PasswordChanged: {
    en: {
      subject: 'Your ClickBeard password has been changed',
      body:
        'Hello, {{name}},\n\n' +
        'This confirms that the password for your ClickBeard account was just changed.\n\n' +
        'If you made this change, no further action is needed. If you did not request it, please contact our support team immediately.\n\n' +
        'Best regards,\n' +
        'The ClickBeard Team',
    },
    'pt-BR': {
      subject: 'Sua senha da ClickBeard foi alterada',
      body:
        'Olá, {{name}},\n\n' +
        'Confirmamos que a senha da sua conta ClickBeard foi alterada.\n\n' +
        'Se foi você quem fez essa alteração, nenhuma ação adicional é necessária. Caso não reconheça essa atividade, entre em contato com nosso suporte imediatamente.\n\n' +
        'Atenciosamente,\n' +
        'Equipe ClickBeard',
    },
  },
  VerificationCodeGenerated: {
    en: {
      subject: 'Your ClickBeard verification code',
      body:
        'Hello, {{name}},\n\n' +
        'Use the code below to complete your verification:\n\n' +
        '{{code}}\n\n' +
        'This code expires in 10 minutes and should not be shared with anyone. If you did not request it, you can safely ignore this message.\n\n' +
        'Best regards,\n' +
        'The ClickBeard Team',
    },
    'pt-BR': {
      subject: 'Seu código de verificação ClickBeard',
      body:
        'Olá, {{name}},\n\n' +
        'Use o código abaixo para concluir sua verificação:\n\n' +
        '{{code}}\n\n' +
        'Este código expira em 10 minutos e não deve ser compartilhado com ninguém. Caso não tenha solicitado, você pode ignorar esta mensagem com segurança.\n\n' +
        'Atenciosamente,\n' +
        'Equipe ClickBeard',
    },
  },
  UserLoggedIn: {
    en: {
      subject: 'New sign-in to your ClickBeard account',
      body:
        'Hello, {{name}},\n\n' +
        'We detected a new sign-in to your ClickBeard account.\n\n' +
        'If this was you, no further action is needed. If you do not recognize this activity, please contact our support team immediately.\n\n' +
        'Best regards,\n' +
        'The ClickBeard Team',
    },
    'pt-BR': {
      subject: 'Novo acesso à sua conta ClickBeard',
      body:
        'Olá, {{name}},\n\n' +
        'Identificamos um novo acesso à sua conta ClickBeard.\n\n' +
        'Se foi você, nenhuma ação adicional é necessária. Caso não reconheça esta atividade, entre em contato com nosso suporte imediatamente.\n\n' +
        'Atenciosamente,\n' +
        'Equipe ClickBeard',
    },
  },
  AppointmentCancelledByAdmin: {
    en: {
      subject: 'Your ClickBeard appointment has been cancelled',
      body:
        'Hello, {{name}},\n\n' +
        'Your appointment scheduled for {{startAt}} has been cancelled.\n\n' +
        'Reason: {{reason}}\n\n' +
        'We apologize for the inconvenience and invite you to schedule a new appointment at your convenience.\n\n' +
        'Best regards,\n' +
        'The ClickBeard Team',
    },
    'pt-BR': {
      subject: 'Seu agendamento na ClickBeard foi cancelado',
      body:
        'Olá, {{name}},\n\n' +
        'Seu agendamento previsto para {{startAt}} foi cancelado.\n\n' +
        'Motivo: {{reason}}\n\n' +
        'Pedimos desculpas pelo transtorno e convidamos você a agendar um novo horário quando for conveniente.\n\n' +
        'Atenciosamente,\n' +
        'Equipe ClickBeard',
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
