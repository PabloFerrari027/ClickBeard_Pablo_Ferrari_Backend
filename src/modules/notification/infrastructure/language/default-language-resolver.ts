import { Injectable } from '@nestjs/common';

import {
  DEFAULT_LANGUAGE,
  LanguageCode,
  LanguageResolver,
} from '../../core/application/ports/language-resolver.port';

/**
 * Identity's `User` has no language/locale field yet, so there is
 * nothing per-recipient to resolve from — every notification is sent in
 * `DEFAULT_LANGUAGE`. Swapping this for a per-user preference later only
 * means replacing this adapter; `LanguageResolver`'s callers never
 * change.
 */
@Injectable()
export class DefaultLanguageResolver implements LanguageResolver {
  resolve(): Promise<LanguageCode> {
    return Promise.resolve(DEFAULT_LANGUAGE);
  }
}
