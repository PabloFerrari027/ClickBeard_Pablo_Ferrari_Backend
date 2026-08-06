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
  private readonly DB_POOL_MAX: number = Number(
    process.env.DB_POOL_MAX ?? 10,
  );

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
}
