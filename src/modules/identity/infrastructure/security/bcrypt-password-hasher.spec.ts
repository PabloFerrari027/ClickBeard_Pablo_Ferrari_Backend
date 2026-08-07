import * as bcrypt from 'bcrypt';

import { BcryptPasswordHasher } from './bcrypt-password-hasher';
import { EnvConfig } from '../../../../shared/config/env.config';

jest.mock('bcrypt');

describe('BcryptPasswordHasher', () => {
  let envConfig: EnvConfig;
  let hasher: BcryptPasswordHasher;

  beforeEach(() => {
    jest.clearAllMocks();
    envConfig = { bcryptSaltRounds: 10 } as unknown as EnvConfig;
    hasher = new BcryptPasswordHasher(envConfig);
  });

  describe('hash', () => {
    it('hashes the plain text using the configured salt rounds', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-value');

      const result = await hasher.hash('plain-password');

      expect(bcrypt.hash).toHaveBeenCalledWith('plain-password', 10);
      expect(result).toBe('hashed-value');
    });
  });

  describe('compare', () => {
    it('returns true when the plain text matches the hash', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await hasher.compare('plain-password', 'hashed-value');

      expect(bcrypt.compare).toHaveBeenCalledWith(
        'plain-password',
        'hashed-value',
      );
      expect(result).toBe(true);
    });

    it('returns false when the plain text does not match the hash', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await hasher.compare('wrong-password', 'hashed-value');

      expect(result).toBe(false);
    });
  });
});
