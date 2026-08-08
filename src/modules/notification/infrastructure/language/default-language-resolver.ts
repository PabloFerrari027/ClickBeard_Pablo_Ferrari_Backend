import { Injectable } from '@nestjs/common';

import {
  DEFAULT_LANGUAGE,
  LanguageCode,
  LanguageResolver,
} from '../../core/application/ports/language-resolver.port';
import { EnvConfig } from '../../../../shared/config/env.config';

const PORTUGUESE_VARIANTS = new Set(['pt', 'pt-br', 'pt_br', 'ptbr']);

/**
 * Normalizes SYSTEM_LANGUAGE down to one of the two languages templates
 * are actually written in. Anything that isn't a recognized Portuguese
 * variant (English, 'us', typos, unset, or any language not yet
 * supported) falls back to DEFAULT_LANGUAGE rather than failing, since
 * StaticMessageTemplateProvider already treats DEFAULT_LANGUAGE as its
 * catch-all.
 */
export function normalizeSystemLanguage(
  rawLanguage: string | undefined,
): LanguageCode {
  if (!rawLanguage) {
    return DEFAULT_LANGUAGE;
  }

  return PORTUGUESE_VARIANTS.has(rawLanguage.trim().toLowerCase())
    ? 'pt-BR'
    : DEFAULT_LANGUAGE;
}

/**
 * Identity's `User` has no language/locale field yet, and notifications
 * are dispatched from a queue consumer with no request to read an
 * Accept-Language header from. Until per-recipient preferences exist,
 * language is a single deployment-wide setting read from
 * SYSTEM_LANGUAGE. Swapping this for a per-user preference later only
 * means replacing this adapter; `LanguageResolver`'s callers never
 * change.
 */
@Injectable()
export class DefaultLanguageResolver implements LanguageResolver {
  private readonly language: LanguageCode;

  constructor(envConfig: EnvConfig) {
    this.language = normalizeSystemLanguage(envConfig.systemLanguage);
  }

  resolve(): Promise<LanguageCode> {
    return Promise.resolve(this.language);
  }
}
