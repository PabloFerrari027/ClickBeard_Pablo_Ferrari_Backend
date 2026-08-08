import { StaticMessageTemplateProvider } from './static-message-template-provider';
import { DEFAULT_LANGUAGE } from '../../core/application/ports/language-resolver.port';

describe('StaticMessageTemplateProvider', () => {
  const provider = new StaticMessageTemplateProvider();

  it('returns a template for a known event in the default language', async () => {
    const template = await provider.getTemplate(
      'UserRegistered',
      DEFAULT_LANGUAGE,
    );

    expect(template).not.toBeNull();
    expect(template?.subject).toContain('{{name}}');
  });

  it('falls back to the default language when the requested one has no template', async () => {
    const template = await provider.getTemplate('UserRegistered', 'fr');

    expect(template).not.toBeNull();
  });

  it('returns the pt-BR template when requested', async () => {
    const template = await provider.getTemplate('UserRegistered', 'pt-BR');

    expect(template).not.toBeNull();
    expect(template?.subject).toContain('{{name}}');
    expect(template?.body).not.toEqual(
      (await provider.getTemplate('UserRegistered', DEFAULT_LANGUAGE))?.body,
    );
  });

  it('returns null for an event with no template (e.g. one that never carries a recipientEmail)', async () => {
    const template = await provider.getTemplate(
      'AppointmentCreated',
      DEFAULT_LANGUAGE,
    );

    expect(template).toBeNull();
  });

  it('returns null for a completely unknown event name', async () => {
    const template = await provider.getTemplate(
      'SomeEventThatDoesNotExist',
      DEFAULT_LANGUAGE,
    );

    expect(template).toBeNull();
  });

  it.each([
    'UserRegistered',
    'PasswordChanged',
    'VerificationCodeGenerated',
    'UserLoggedIn',
    'AppointmentCancelledByAdmin',
  ])(
    'has a template for %s with a non-empty subject and body in both supported languages',
    async (eventName) => {
      for (const language of [DEFAULT_LANGUAGE, 'pt-BR']) {
        const template = await provider.getTemplate(eventName, language);

        expect(template?.subject.length).toBeGreaterThan(0);
        expect(template?.body.length).toBeGreaterThan(0);
      }
    },
  );
});
