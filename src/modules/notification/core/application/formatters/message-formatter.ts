import { MessageTemplate } from '../ports/message-template-provider.port';

const PLACEHOLDER_PATTERN = /\{\{(\w+)\}\}/g;

export interface FormattedMessage {
  subject: string;
  body: string;
}

/**
 * Substitutes `{{variable}}` placeholders in a template using flat
 * string values from an event's payload. Unknown placeholders are left
 * untouched rather than throwing, since templates are managed by infra
 * and may reference variables a given event doesn't provide.
 */
export function formatMessage(
  template: MessageTemplate,
  variables: Record<string, string>,
): FormattedMessage {
  const interpolate = (text: string): string =>
    text.replace(PLACEHOLDER_PATTERN, (match, key: string) =>
      key in variables ? variables[key] : match,
    );

  return {
    subject: interpolate(template.subject),
    body: interpolate(template.body),
  };
}
