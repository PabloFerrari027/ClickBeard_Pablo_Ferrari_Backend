import 'dotenv/config';
import { Injectable } from '@nestjs/common';
import {
  IsBooleanString,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
  validateSync,
} from 'class-validator';

import process from 'node:process';

export type NodeEnv = 'development' | 'production' | 'test';

const NODE_ENVS: NodeEnv[] = ['development', 'production', 'test'];

@Injectable()
export class EnvConfig {
  @IsIn(NODE_ENVS)
  private readonly NODE_ENV: NodeEnv = (process.env.NODE_ENV ??
    'development') as NodeEnv;

  @IsInt()
  @Min(0)
  @Max(65535)
  private readonly PORT: number = Number(process.env.PORT);

  @IsString()
  @IsNotEmpty()
  private readonly DB_HOST: string = process.env.DB_HOST as string;

  @IsInt()
  @Min(0)
  @Max(65535)
  private readonly DB_PORT: number = Number(process.env.DB_PORT);

  @IsString()
  @IsNotEmpty()
  private readonly DB_USER: string = process.env.DB_USER as string;

  @IsString()
  @IsNotEmpty()
  private readonly DB_PASSWORD: string = process.env.DB_PASSWORD as string;

  @IsString()
  @IsNotEmpty()
  private readonly DB_NAME: string = process.env.DB_NAME as string;

  @IsInt()
  @Min(1)
  private readonly DB_POOL_MAX: number = Number(process.env.DB_POOL_MAX ?? 10);

  @IsInt()
  @Min(0)
  private readonly DB_POOL_MIN: number = Number(process.env.DB_POOL_MIN ?? 0);

  @IsInt()
  @Min(0)
  private readonly DB_POOL_IDLE_MS: number = Number(
    process.env.DB_POOL_IDLE_MS ?? 10_000,
  );

  @IsInt()
  @Min(0)
  private readonly DB_POOL_ACQUIRE_MS: number = Number(
    process.env.DB_POOL_ACQUIRE_MS ?? 30_000,
  );

  @IsOptional()
  @IsBooleanString()
  private readonly DB_SSL: string = process.env.DB_SSL ?? 'false';

  @IsString()
  @IsNotEmpty()
  private readonly REDIS_HOST: string = process.env.REDIS_HOST as string;

  @IsInt()
  @Min(0)
  @Max(65535)
  private readonly REDIS_PORT: number = Number(process.env.REDIS_PORT);

  @IsOptional()
  @IsString()
  private readonly REDIS_PASSWORD: string | undefined =
    process.env.REDIS_PASSWORD || undefined;

  /** Redis logical database index (0-15) — lets dev/test share one Redis server without sharing a keyspace. */
  @IsInt()
  @Min(0)
  @Max(15)
  private readonly REDIS_DB: number = Number(process.env.REDIS_DB ?? 0);

  @IsString()
  @IsNotEmpty()
  private readonly JWT_ACCESS_SECRET: string = process.env
    .JWT_ACCESS_SECRET as string;

  @IsString()
  @IsNotEmpty()
  private readonly JWT_ACCESS_EXPIRES_IN: string =
    process.env.JWT_ACCESS_EXPIRES_IN ?? '15m';

  @IsString()
  @IsNotEmpty()
  private readonly JWT_REFRESH_SECRET: string = process.env
    .JWT_REFRESH_SECRET as string;

  @IsString()
  @IsNotEmpty()
  private readonly JWT_REFRESH_EXPIRES_IN: string =
    process.env.JWT_REFRESH_EXPIRES_IN ?? '7d';

  @IsInt()
  @Min(4)
  @Max(15)
  private readonly BCRYPT_SALT_ROUNDS: number = Number(
    process.env.BCRYPT_SALT_ROUNDS ?? 10,
  );

  @IsString()
  @IsNotEmpty()
  private readonly SMTP_HOST: string = process.env.SMTP_HOST as string;

  @IsInt()
  @Min(0)
  @Max(65535)
  private readonly SMTP_PORT: number = Number(process.env.SMTP_PORT ?? 587);

  @IsOptional()
  @IsString()
  private readonly SMTP_USER: string | undefined =
    process.env.SMTP_USER || undefined;

  @IsOptional()
  @IsString()
  private readonly SMTP_PASSWORD: string | undefined =
    process.env.SMTP_PASSWORD || undefined;

  @IsString()
  @IsNotEmpty()
  private readonly SMTP_FROM: string = process.env.SMTP_FROM as string;

  @IsOptional()
  @IsBooleanString()
  private readonly SMTP_SECURE: string = process.env.SMTP_SECURE ?? 'false';

  /** Comma-separated list of allowed origins, or `*` to reflect any origin. */
  @IsString()
  @IsNotEmpty()
  private readonly CORS_ORIGIN: string = process.env.CORS_ORIGIN ?? '*';

  @IsInt()
  @Min(1000)
  private readonly THROTTLE_TTL_MS: number = Number(
    process.env.THROTTLE_TTL_MS ?? 60_000,
  );

  @IsInt()
  @Min(1)
  private readonly THROTTLE_LIMIT: number = Number(
    process.env.THROTTLE_LIMIT ?? 100,
  );

  constructor() {
    const errors = validateSync(this);

    if (errors.length > 0) {
      throw new Error(
        `Invalid environment variables:\n${errors
          .map((error) => Object.values(error.constraints ?? {}).join(', '))
          .join('\n')}`,
      );
    }
  }

  get nodeEnv(): NodeEnv {
    return this.NODE_ENV;
  }

  get isProduction(): boolean {
    return this.NODE_ENV === 'production';
  }

  get port(): number {
    return this.PORT;
  }

  get dbHost(): string {
    return this.DB_HOST;
  }

  get dbPort(): number {
    return this.DB_PORT;
  }

  get dbUser(): string {
    return this.DB_USER;
  }

  get dbPassword(): string {
    return this.DB_PASSWORD;
  }

  get dbName(): string {
    return this.DB_NAME;
  }

  get dbPoolMax(): number {
    return this.DB_POOL_MAX;
  }

  get dbPoolMin(): number {
    return this.DB_POOL_MIN;
  }

  get dbPoolIdleMs(): number {
    return this.DB_POOL_IDLE_MS;
  }

  get dbPoolAcquireMs(): number {
    return this.DB_POOL_ACQUIRE_MS;
  }

  get dbSsl(): boolean {
    return this.DB_SSL === 'true';
  }

  get redisHost(): string {
    return this.REDIS_HOST;
  }

  get redisPort(): number {
    return this.REDIS_PORT;
  }

  get redisPassword(): string | undefined {
    return this.REDIS_PASSWORD;
  }

  get redisDb(): number {
    return this.REDIS_DB;
  }

  get jwtAccessSecret(): string {
    return this.JWT_ACCESS_SECRET;
  }

  get jwtAccessExpiresIn(): string {
    return this.JWT_ACCESS_EXPIRES_IN;
  }

  get jwtRefreshSecret(): string {
    return this.JWT_REFRESH_SECRET;
  }

  get jwtRefreshExpiresIn(): string {
    return this.JWT_REFRESH_EXPIRES_IN;
  }

  get bcryptSaltRounds(): number {
    return this.BCRYPT_SALT_ROUNDS;
  }

  get smtpHost(): string {
    return this.SMTP_HOST;
  }

  get smtpPort(): number {
    return this.SMTP_PORT;
  }

  get smtpUser(): string | undefined {
    return this.SMTP_USER;
  }

  get smtpPassword(): string | undefined {
    return this.SMTP_PASSWORD;
  }

  get smtpFrom(): string {
    return this.SMTP_FROM;
  }

  get smtpSecure(): boolean {
    return this.SMTP_SECURE === 'true';
  }

  /** `true` (reflect any origin) when `CORS_ORIGIN=*`, else the parsed allow-list. */
  get corsOrigins(): true | string[] {
    return this.CORS_ORIGIN === '*'
      ? true
      : this.CORS_ORIGIN.split(',').map((origin) => origin.trim());
  }

  get throttleTtlMs(): number {
    return this.THROTTLE_TTL_MS;
  }

  get throttleLimit(): number {
    return this.THROTTLE_LIMIT;
  }
}
