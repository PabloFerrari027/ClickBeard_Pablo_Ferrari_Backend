import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { PasswordHasher } from '../../core/application/ports/password-hasher.port';
import { EnvConfig } from '../../../../shared/config/env.config';

@Injectable()
export class BcryptPasswordHasher implements PasswordHasher {
  constructor(private readonly envConfig: EnvConfig) {}

  async hash(plainText: string): Promise<string> {
    return bcrypt.hash(plainText, this.envConfig.bcryptSaltRounds);
  }

  async compare(plainText: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plainText, hash);
  }
}
