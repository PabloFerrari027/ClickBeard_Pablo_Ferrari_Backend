import { CallHandler, ExecutionContext } from '@nestjs/common';
import { lastValueFrom, of } from 'rxjs';

import { FieldSelectionInterceptor } from './field-selection.interceptor';

describe('FieldSelectionInterceptor', () => {
  let interceptor: FieldSelectionInterceptor;

  beforeEach(() => {
    interceptor = new FieldSelectionInterceptor();
  });

  function buildContext(query: Record<string, unknown>): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ query }),
      }),
    } as unknown as ExecutionContext;
  }

  function buildHandler(data: unknown): CallHandler {
    return { handle: () => of(data) } as CallHandler;
  }

  async function run(
    query: Record<string, unknown>,
    data: unknown,
  ): Promise<unknown> {
    const context = buildContext(query);
    const handler = buildHandler(data);

    return lastValueFrom(
      interceptor.intercept(context, handler) as ReturnType<
        typeof handler.handle
      >,
    );
  }

  it('returns the data unchanged when there is no fields query param', async () => {
    const result = await run({}, { id: '1', name: 'Jane', secret: 'x' });

    expect(result).toEqual({ id: '1', name: 'Jane', secret: 'x' });
  });

  it('returns the data unchanged when fields is an empty string', async () => {
    const result = await run({ fields: '' }, { id: '1', name: 'Jane' });

    expect(result).toEqual({ id: '1', name: 'Jane' });
  });

  it('returns the data unchanged when fields is only whitespace', async () => {
    const result = await run({ fields: '   ' }, { id: '1', name: 'Jane' });

    expect(result).toEqual({ id: '1', name: 'Jane' });
  });

  it('returns the data unchanged when fields has content but no valid entries after splitting', async () => {
    const result = await run({ fields: ' , , ' }, { id: '1', name: 'Jane' });

    expect(result).toEqual({ id: '1', name: 'Jane' });
  });

  it('returns the data unchanged when fields is not a string (e.g. repeated query param)', async () => {
    const result = await run(
      { fields: ['id', 'name'] },
      { id: '1', name: 'Jane', secret: 'x' },
    );

    expect(result).toEqual({ id: '1', name: 'Jane', secret: 'x' });
  });

  it('picks only the requested fields from a single object', async () => {
    const result = await run(
      { fields: 'id,name' },
      { id: '1', name: 'Jane', secret: 'x' },
    );

    expect(result).toEqual({ id: '1', name: 'Jane' });
  });

  it('trims whitespace and ignores empty entries in the fields list', async () => {
    const result = await run(
      { fields: ' id , , name ' },
      { id: '1', name: 'Jane', secret: 'x' },
    );

    expect(result).toEqual({ id: '1', name: 'Jane' });
  });

  it('omits requested fields that do not exist on the source object', async () => {
    const result = await run({ fields: 'id,missing' }, { id: '1' });

    expect(result).toEqual({ id: '1' });
  });

  it('applies field selection to every item when data is an array', async () => {
    const result = await run({ fields: 'id' }, [
      { id: '1', name: 'Jane' },
      { id: '2', name: 'John' },
    ]);

    expect(result).toEqual([{ id: '1' }, { id: '2' }]);
  });

  it('returns non-object items in an array unchanged', async () => {
    const result = await run({ fields: 'id' }, [1, 'text', null]);

    expect(result).toEqual([1, 'text', null]);
  });

  it('returns primitive top-level data unchanged', async () => {
    const result = await run({ fields: 'id' }, 'plain-string');

    expect(result).toBe('plain-string');
  });

  it('returns null top-level data unchanged', async () => {
    const result = await run({ fields: 'id' }, null);

    expect(result).toBeNull();
  });
});
