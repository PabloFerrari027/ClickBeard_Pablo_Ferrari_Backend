import {
  DefaultLanguageResolver,
  normalizeSystemLanguage,
} from './default-language-resolver';
import { EnvConfig } from '../../../../shared/config/env.config';

function buildEnvConfig(systemLanguage: string | undefined): EnvConfig {
  return { systemLanguage } as unknown as EnvConfig;
}

describe('normalizeSystemLanguage', () => {
  it.each(['pt', 'pt-BR', 'PT-br', 'pt_br', 'ptbr'])(
    'normalizes %s to pt-BR',
    (raw) => {
      expect(normalizeSystemLanguage(raw)).toBe('pt-BR');
    },
  );

  it.each(['en', 'en-US', 'us', 'fr', 'es-ES', ''])(
    'falls back to en for %s',
    (raw) => {
      expect(normalizeSystemLanguage(raw)).toBe('en');
    },
  );

  it('falls back to en when unset', () => {
    expect(normalizeSystemLanguage(undefined)).toBe('en');
  });
});

describe('DefaultLanguageResolver', () => {
  it('resolves to pt-BR when SYSTEM_LANGUAGE is a Portuguese variant', async () => {
    const resolver = new DefaultLanguageResolver(buildEnvConfig('pt-BR'));

    await expect(resolver.resolve()).resolves.toBe('pt-BR');
  });

  it('resolves to en when SYSTEM_LANGUAGE is unset or unsupported', async () => {
    const resolver = new DefaultLanguageResolver(buildEnvConfig(undefined));

    await expect(resolver.resolve()).resolves.toBe('en');
  });
});
