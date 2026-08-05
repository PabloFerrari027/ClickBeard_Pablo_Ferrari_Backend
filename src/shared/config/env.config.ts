import 'dotenv/config';
import { Injectable } from '@nestjs/common';
import {
  IsInt,
  IsNotEmpty,
  IsString,
  Max,
  Min,
  validateSync,
} from 'class-validator';

// @ts-expect-error: importar process do Node para leitura das variáveis de ambiente
import process from 'node:process';

@Injectable()
export class EnvConfig {
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
        `Variáveis de ambiente inválidas:\n${errors
          .map((error) => Object.values(error.constraints ?? {}).join(', '))
          .join('\n')}`,
      );
    }
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

  get redisHost(): string {
    return this.REDIS_HOST;
  }

  get redisPort(): number {
    return this.REDIS_PORT;
  }
}
