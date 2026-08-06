import { randomUUID } from 'node:crypto';

import { RefreshTokenAlreadyRevokedError } from '../errors/refresh-token-already-revoked.error';

export interface RefreshTokenProps {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
  replacedByTokenId: string | null;
  createdAt: Date;
}

export class RefreshToken {
  private readonly id: string;
  private readonly userId: string;
  private readonly tokenHash: string;
  private readonly expiresAt: Date;
  private revokedAt: Date | null;
  private replacedByTokenId: string | null;
  private readonly createdAt: Date;

  private constructor(props: RefreshTokenProps) {
    this.id = props.id;
    this.userId = props.userId;
    this.tokenHash = props.tokenHash;
    this.expiresAt = props.expiresAt;
    this.revokedAt = props.revokedAt;
    this.replacedByTokenId = props.replacedByTokenId;
    this.createdAt = props.createdAt;
  }

  static create(props: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }): RefreshToken {
    return new RefreshToken({
      id: randomUUID(),
      userId: props.userId,
      tokenHash: props.tokenHash,
      expiresAt: props.expiresAt,
      revokedAt: null,
      replacedByTokenId: null,
      createdAt: new Date(),
    });
  }

  static restore(props: RefreshTokenProps): RefreshToken {
    return new RefreshToken(props);
  }

  /**
   * Revokes this token. When `replacedByTokenId` is provided, the
   * revocation represents a rotation: this token was exchanged for the
   * one identified by that id.
   */
  revoke(replacedByTokenId?: string): void {
    if (this.isRevoked()) {
      throw new RefreshTokenAlreadyRevokedError();
    }

    this.revokedAt = new Date();
    this.replacedByTokenId = replacedByTokenId ?? null;
  }

  isExpired(): boolean {
    return this.expiresAt.getTime() < Date.now();
  }

  isRevoked(): boolean {
    return this.revokedAt !== null;
  }

  isValid(): boolean {
    return !this.isExpired() && !this.isRevoked();
  }

  getId(): string {
    return this.id;
  }

  getUserId(): string {
    return this.userId;
  }

  getTokenHash(): string {
    return this.tokenHash;
  }

  getExpiresAt(): Date {
    return this.expiresAt;
  }

  getRevokedAt(): Date | null {
    return this.revokedAt;
  }

  getReplacedByTokenId(): string | null {
    return this.replacedByTokenId;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }
}
