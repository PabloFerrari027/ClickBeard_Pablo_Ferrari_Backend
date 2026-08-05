import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request } from 'express';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

const FIELDS_QUERY_PARAM = 'fields';

/**
 * Lets API clients request a sparse fieldset via `?fields=a,b,c`, so the
 * response JSON only contains the requested top-level keys. Meant to be
 * applied per-controller; responses without a matching shape (void,
 * primitives) are returned unchanged.
 */
@Injectable()
export class FieldSelectionInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const fields = this.parseFields(request.query[FIELDS_QUERY_PARAM]);

    if (!fields) {
      return next.handle();
    }

    return next.handle().pipe(map((data) => this.select(data, fields)));
  }

  private parseFields(rawFields: unknown): string[] | null {
    if (typeof rawFields !== 'string' || rawFields.trim().length === 0) {
      return null;
    }

    const fields = rawFields
      .split(',')
      .map((field) => field.trim())
      .filter(Boolean);

    return fields.length > 0 ? fields : null;
  }

  private select(data: unknown, fields: string[]): unknown {
    if (Array.isArray(data)) {
      return data.map((item) => this.pick(item, fields));
    }

    return this.pick(data, fields);
  }

  private pick(item: unknown, fields: string[]): unknown {
    if (typeof item !== 'object' || item === null) {
      return item;
    }

    const source = item as Record<string, unknown>;
    const result: Record<string, unknown> = {};

    for (const field of fields) {
      if (field in source) {
        result[field] = source[field];
      }
    }

    return result;
  }
}
