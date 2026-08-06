import { randomUUID } from 'node:crypto';

import { VerificationCodeAlreadyInvalidatedError } from '../errors/verification-code-already-invalidated.error';
import { VerificationCodeAlreadyUsedError } from '../errors/verification-code-already-used.error';

const MAX_ATTEMPTS = 5;
const CODE_TTL_MINUTES = 10;

export interface VerificationCodeProps {
  id: string;
  userId: string;
  codeHash: string;
  expiresAt: Date;
  attempts: number;
  consumedAt: Date | null;
  invalidatedAt: Date | null;
  createdAt: Date;
}

export class VerificationCode {
  private readonly id: string;
  private readonly userId: string;
  private readonly codeHash: string;
  private readonly expiresAt: Date;
  private attempts: number;
  private consumedAt: Date | null;
  private invalidatedAt: Date | null;
  private readonly createdAt: Date;

  private constructor(props: VerificationCodeProps) {
    this.id = props.id;
    this.userId = props.userId;
    this.codeHash = props.codeHash;
    this.expiresAt = props.expiresAt;
    this.attempts = props.attempts;
    this.consumedAt = props.consumedAt;
    this.invalidatedAt = props.invalidatedAt;
    this.createdAt = props.createdAt;
  }

  static create(props: {
    userId: string;
    codeHash: string;
    generatedAt: Date;
  }): VerificationCode {
    return new VerificationCode({
      id: randomUUID(),
      userId: props.userId,
      codeHash: props.codeHash,
      expiresAt: new Date(
        props.generatedAt.getTime() + CODE_TTL_MINUTES * 60_000,
      ),
      attempts: 0,
      consumedAt: null,
      invalidatedAt: null,
      createdAt: props.generatedAt,
    });
  }

  static restore(props: VerificationCodeProps): VerificationCode {
    return new VerificationCode(props);
  }

  recordFailedAttempt(): void {
    this.attempts += 1;
  }

  consume(now: Date): void {
    if (this.isConsumed()) {
      throw new VerificationCodeAlreadyUsedError();
    }

    if (this.isInvalidated()) {
      throw new VerificationCodeAlreadyInvalidatedError();
    }

    this.consumedAt = now;
  }

  invalidate(now: Date): void {
    if (this.isInvalidated()) {
      throw new VerificationCodeAlreadyInvalidatedError();
    }

    this.invalidatedAt = now;
  }

  isExpired(now: Date): boolean {
    return this.expiresAt.getTime() < now.getTime();
  }

  isConsumed(): boolean {
    return this.consumedAt !== null;
  }

  isInvalidated(): boolean {
    return this.invalidatedAt !== null;
  }

  isActive(now: Date): boolean {
    return !this.isExpired(now) && !this.isConsumed() && !this.isInvalidated();
  }

  hasExceededAttempts(): boolean {
    return this.attempts >= MAX_ATTEMPTS;
  }

  getId(): string {
    return this.id;
  }

  getUserId(): string {
    return this.userId;
  }

  getCodeHash(): string {
    return this.codeHash;
  }

  getExpiresAt(): Date {
    return this.expiresAt;
  }

  getAttempts(): number {
    return this.attempts;
  }

  getConsumedAt(): Date | null {
    return this.consumedAt;
  }

  getInvalidatedAt(): Date | null {
    return this.invalidatedAt;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }
}
