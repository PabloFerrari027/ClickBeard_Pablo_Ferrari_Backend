import { LanguageCode } from '../../core/application/ports/language-resolver.port';

const FOOTER_TEXT: Record<'en' | 'pt-BR', string> = {
  en: 'This is an automated message from ClickBeard. Please do not reply to this email.',
  'pt-BR':
    'Esta é uma mensagem automática da ClickBeard. Por favor, não responda a este e-mail.',
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderParagraphs(body: string): string {
  return body
    .split('\n\n')
    .map((paragraph) => escapeHtml(paragraph).replace(/\n/g, '<br>'))
    .map((paragraph) => `<p style="margin:0 0 16px;">${paragraph}</p>`)
    .join('');
}

/**
 * Wraps a plain-text notification body in a minimal, table-based HTML
 * shell with inline styles. Most email clients strip <style> blocks and
 * ignore modern CSS layout, so a table-based layout with inline styles is
 * the only approach that renders consistently across clients (Outlook in
 * particular). No external assets or webfonts, to avoid broken images and
 * render-blocking requests in clients that fetch remote content.
 */
export function renderBrandedEmailHtml(params: {
  body: string;
  language: LanguageCode;
}): string {
  const footer =
    FOOTER_TEXT[params.language as 'en' | 'pt-BR'] ?? FOOTER_TEXT.en;

  return `<!doctype html>
<html lang="${escapeHtml(params.language)}">
  <body style="margin:0;padding:0;background-color:#f4f4f7;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f7;padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;">
            <tr>
              <td style="background-color:#1a1a2e;padding:20px 32px;">
                <span style="color:#ffffff;font-size:20px;font-weight:bold;letter-spacing:0.5px;">ClickBeard</span>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;color:#333333;font-size:15px;line-height:1.6;">
                ${renderParagraphs(params.body)}
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px;background-color:#f4f4f7;color:#8a8a8a;font-size:12px;border-top:1px solid #eeeeee;">
                ${escapeHtml(footer)}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
