import { DefaultLanguageResolver } from './default-language-resolver';
import { DEFAULT_LANGUAGE } from '../../core/application/ports/language-resolver.port';

describe('DefaultLanguageResolver', () => {
  const resolver = new DefaultLanguageResolver();

  it('always resolves to the default language', async () => {
    await expect(resolver.resolve()).resolves.toBe(DEFAULT_LANGUAGE);
  });
});
