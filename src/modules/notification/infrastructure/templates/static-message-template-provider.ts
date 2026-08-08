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
        'Dear {{name}},\n\n' +
        'Welcome to ClickBeard. Your account has been created successfully, and you can now book appointments with our barbers.\n\n' +
        'If you have any questions, our support team is available to assist you.\n\n' +
        'Best regards,\n' +
        'The ClickBeard Team',
    },
    'pt-BR': {
      subject: 'Bem-vindo(a) à ClickBeard, {{name}}',
      body:
        'Prezado(a) {{name}},\n\n' +
        'Seja bem-vindo(a) à ClickBeard. Sua conta foi criada com sucesso e você já pode agendar horários com nossos barbeiros.\n\n' +
        'Caso tenha alguma dúvida, nossa equipe de suporte está à disposição.\n\n' +
        'Atenciosamente,\n' +
        'Equipe ClickBeard',
    },
  },
  PasswordChanged: {
    en: {
      subject: 'Your ClickBeard password has been changed',
      body:
        'Dear {{name}},\n\n' +
        'This is a confirmation that the password for your ClickBeard account was recently changed.\n\n' +
        'If you did not request this change, please contact our support team immediately so we can help secure your account.\n\n' +
        'Best regards,\n' +
        'The ClickBeard Team',
    },
    'pt-BR': {
      subject: 'Sua senha da ClickBeard foi alterada',
      body:
        'Prezado(a) {{name}},\n\n' +
        'Confirmamos que a senha da sua conta ClickBeard foi alterada recentemente.\n\n' +
        'Caso não tenha solicitado essa alteração, entre em contato com nossa equipe de suporte imediatamente para que possamos ajudar a proteger sua conta.\n\n' +
        'Atenciosamente,\n' +
        'Equipe ClickBeard',
    },
  },
  VerificationCodeGenerated: {
    en: {
      subject: 'Your ClickBeard verification code',
      body:
        'Dear {{name}},\n\n' +
        'Your verification code is: {{code}}\n\n' +
        'This code will expire in 10 minutes. If you did not request this code, please disregard this message.\n\n' +
        'Best regards,\n' +
        'The ClickBeard Team',
    },
    'pt-BR': {
      subject: 'Seu código de verificação ClickBeard',
      body:
        'Prezado(a) {{name}},\n\n' +
        'Seu código de verificação é: {{code}}\n\n' +
        'Este código expira em 10 minutos. Caso não tenha solicitado este código, por favor desconsidere esta mensagem.\n\n' +
        'Atenciosamente,\n' +
        'Equipe ClickBeard',
    },
  },
  UserLoggedIn: {
    en: {
      subject: 'New sign-in to your ClickBeard account',
      body:
        'Dear {{name}},\n\n' +
        'We are writing to inform you of a new sign-in to your ClickBeard account.\n\n' +
        'If this was you, no further action is needed. If you do not recognize this activity, please contact our support team immediately.\n\n' +
        'Best regards,\n' +
        'The ClickBeard Team',
    },
    'pt-BR': {
      subject: 'Novo acesso à sua conta ClickBeard',
      body:
        'Prezado(a) {{name}},\n\n' +
        'Informamos que houve um novo acesso à sua conta ClickBeard.\n\n' +
        'Se foi você, nenhuma ação adicional é necessária. Caso não reconheça esta atividade, entre em contato com nossa equipe de suporte imediatamente.\n\n' +
        'Atenciosamente,\n' +
        'Equipe ClickBeard',
    },
  },
  AppointmentCancelledByAdmin: {
    en: {
      subject: 'Your ClickBeard appointment has been cancelled',
      body:
        'Dear {{name}},\n\n' +
        'We regret to inform you that your appointment scheduled for {{startAt}} has been cancelled.\n\n' +
        'Reason: {{reason}}\n\n' +
        'We apologize for any inconvenience this may cause and invite you to schedule a new appointment at your convenience.\n\n' +
        'Best regards,\n' +
        'The ClickBeard Team',
    },
    'pt-BR': {
      subject: 'Seu agendamento na ClickBeard foi cancelado',
      body:
        'Prezado(a) {{name}},\n\n' +
        'Informamos que seu agendamento previsto para {{startAt}} foi cancelado.\n\n' +
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
