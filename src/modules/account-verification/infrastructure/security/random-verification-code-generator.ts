import { randomInt } from 'node:crypto';

import { Injectable } from '@nestjs/common';

import { VerificationCodeGenerator } from '../../core/application/ports/verification-code-generator.port';

const CODE_LENGTH = 6;
const CODE_UPPER_BOUND = 10 ** CODE_LENGTH;

@Injectable()
export class RandomVerificationCodeGenerator implements VerificationCodeGenerator {
  generate(): Promise<string> {
    return Promise.resolve(
      randomInt(0, CODE_UPPER_BOUND).toString().padStart(CODE_LENGTH, '0'),
    );
  }
}
