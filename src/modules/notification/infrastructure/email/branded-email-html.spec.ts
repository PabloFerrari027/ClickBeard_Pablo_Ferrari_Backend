import { renderBrandedEmailHtml } from './branded-email-html';

describe('renderBrandedEmailHtml', () => {
  it('renders each paragraph of the body as its own <p> element', () => {
    const html = renderBrandedEmailHtml({
      body: 'Dear Jane,\n\nWelcome aboard.',
      language: 'en',
    });

    expect(html).toContain('<p style="margin:0 0 16px;">Dear Jane,</p>');
    expect(html).toContain('<p style="margin:0 0 16px;">Welcome aboard.</p>');
  });

  it('escapes HTML special characters in the body', () => {
    const html = renderBrandedEmailHtml({
      body: '<script>alert(1)</script>',
      language: 'en',
    });

    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('uses the English footer for en', () => {
    const html = renderBrandedEmailHtml({ body: 'Hello.', language: 'en' });

    expect(html).toContain('automated message from ClickBeard');
  });

  it('uses the Portuguese footer for pt-BR', () => {
    const html = renderBrandedEmailHtml({
      body: 'Ola.',
      language: 'pt-BR',
    });

    expect(html).toContain('mensagem automática da ClickBeard');
  });

  it('falls back to the English footer for an unsupported language', () => {
    const html = renderBrandedEmailHtml({ body: 'Hello.', language: 'fr' });

    expect(html).toContain('automated message from ClickBeard');
  });
});
