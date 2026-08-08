import { DomainEvent } from '../../../../../shared/domain/events/domain-event';
import { LanguageResolver } from '../ports/language-resolver.port';
import { MessageTemplateProvider } from '../ports/message-template-provider.port';
import { NotificationSender } from '../ports/notification-sender.port';
import { DispatchNotificationUseCase } from './dispatch-notification.use-case';

function buildEvent(overrides: Partial<DomainEvent> = {}): DomainEvent {
  return {
    name: 'UserRegistered',
    occurredAt: new Date('2026-01-01T00:00:00.000Z'),
    recipientEmail: 'jane@example.com',
    payload: { name: 'Jane' },
    ...overrides,
  };
}

describe('DispatchNotificationUseCase', () => {
  let languageResolver: jest.Mocked<LanguageResolver>;
  let templateProvider: jest.Mocked<MessageTemplateProvider>;
  let notificationSender: jest.Mocked<NotificationSender>;
  let useCase: DispatchNotificationUseCase;

  beforeEach(() => {
    languageResolver = {
      resolve: jest.fn(),
    };
    templateProvider = {
      getTemplate: jest.fn(),
    };
    notificationSender = {
      send: jest.fn(),
    };
    useCase = new DispatchNotificationUseCase(
      languageResolver,
      templateProvider,
      notificationSender,
    );
  });

  it('resolves the language, formats the template and sends the notification', async () => {
    languageResolver.resolve.mockResolvedValue('pt-BR');
    templateProvider.getTemplate.mockResolvedValue({
      subject: 'Bem-vindo, {{name}}!',
      body: 'Ola {{name}}, sua conta foi criada.',
    });

    await useCase.execute(buildEvent());

    expect(languageResolver.resolve).toHaveBeenCalledWith('jane@example.com');
    expect(templateProvider.getTemplate).toHaveBeenCalledWith(
      'UserRegistered',
      'pt-BR',
    );
    expect(notificationSender.send).toHaveBeenCalledWith({
      recipient: 'jane@example.com',
      subject: 'Bem-vindo, Jane!',
      body: 'Ola Jane, sua conta foi criada.',
      language: 'pt-BR',
    });
  });

  it('does nothing when the event has no recipient email', async () => {
    await useCase.execute(buildEvent({ recipientEmail: undefined }));

    expect(languageResolver.resolve).not.toHaveBeenCalled();
    expect(notificationSender.send).not.toHaveBeenCalled();
  });

  it('does nothing when there is no template for the event and language', async () => {
    languageResolver.resolve.mockResolvedValue('en');
    templateProvider.getTemplate.mockResolvedValue(null);

    await useCase.execute(buildEvent());

    expect(notificationSender.send).not.toHaveBeenCalled();
  });
});
