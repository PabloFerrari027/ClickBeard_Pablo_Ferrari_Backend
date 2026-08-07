import { RandomVerificationCodeGenerator } from './random-verification-code-generator';

describe('RandomVerificationCodeGenerator', () => {
  const generator = new RandomVerificationCodeGenerator();

  it('always generates a 6-digit numeric string, zero-padded when needed', async () => {
    const codes = await Promise.all(
      Array.from({ length: 200 }, () => generator.generate()),
    );

    for (const code of codes) {
      expect(code).toMatch(/^\d{6}$/);
    }
  });

  it('generates different codes across calls (not a fixed constant)', async () => {
    const codes = await Promise.all(
      Array.from({ length: 20 }, () => generator.generate()),
    );

    expect(new Set(codes).size).toBeGreaterThan(1);
  });
});
