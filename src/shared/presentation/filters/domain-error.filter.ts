import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

import { ConflictError } from '../../domain/errors/conflict.error';
import { DomainError } from '../../domain/errors/domain.error';
import { ForbiddenError } from '../../domain/errors/forbidden.error';
import { NotFoundError } from '../../domain/errors/not-found.error';
import { UnauthorizedError } from '../../domain/errors/unauthorized.error';

function statusFor(error: DomainError): HttpStatus {
  if (error instanceof NotFoundError) {
    return HttpStatus.NOT_FOUND;
  }

  if (error instanceof ConflictError) {
    return HttpStatus.CONFLICT;
  }

  if (error instanceof UnauthorizedError) {
    return HttpStatus.UNAUTHORIZED;
  }

  if (error instanceof ForbiddenError) {
    return HttpStatus.FORBIDDEN;
  }

  // ValidationError, and any DomainError not further categorized.
  return HttpStatus.BAD_REQUEST;
}

/**
 * Translates every `DomainError` a use case raises into the HTTP status
 * its category implies. Without this, Nest's default filter treats any
 * non-`HttpException` as a 500 — a plain business-rule violation (e.g.
 * "barber not found") would incorrectly read as a server error to API
 * clients. `PersistenceError` and friends deliberately do NOT extend
 * `DomainError`, so genuine infrastructure failures still fall through
 * to the default filter and correctly surface as 500s.
 */
@Catch(DomainError)
export class DomainErrorFilter implements ExceptionFilter {
  catch(error: DomainError, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const status = statusFor(error);

    response.status(status).json({
      statusCode: status,
      message: error.message,
      error: error.name,
    });
  }
}
