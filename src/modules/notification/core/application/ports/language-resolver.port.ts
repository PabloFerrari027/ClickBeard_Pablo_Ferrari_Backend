export const LANGUAGE_RESOLVER = Symbol('LanguageResolver');

/**
 * A plain string (e.g. 'en', 'pt-BR') rather than a closed enum, so new
 * languages can be supported by adding a resolver/template entry without
 * changing any Core code.
 */
export type LanguageCode = string;

export const DEFAULT_LANGUAGE: LanguageCode = 'en';

export interface LanguageResolver {
  /**
   * Resolves by recipient email rather than a module-specific user id,
   * since the email is the one identifying field every notifiable
   * DomainEvent is guaranteed to carry.
   */
  resolve(recipientEmail: string): Promise<LanguageCode>;
}
