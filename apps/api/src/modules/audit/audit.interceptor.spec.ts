import { ExecutionContext, CallHandler, ForbiddenException } from '@nestjs/common';
import { firstValueFrom, of, throwError } from 'rxjs';
import { RoleName } from '@app/data';
import { AuditInterceptor } from './audit.interceptor';

const buildContext = (overrides: Partial<{ method: string; url: string; user: unknown; params: { id?: string } }>) =>
  ({
    switchToHttp: () => ({
      getRequest: () => ({
        method: 'POST',
        url: '/api/tasks',
        params: {},
        user: undefined,
        ...overrides,
      }),
    }),
  }) as unknown as ExecutionContext;

const handler = (impl: () => unknown): CallHandler => ({ handle: () => impl() as never });

describe('AuditInterceptor', () => {
  let audit: { record: jest.Mock };
  let interceptor: AuditInterceptor;

  beforeEach(() => {
    audit = { record: jest.fn() };
    interceptor = new AuditInterceptor(audit as never);
  });

  it('skips logging for unauthenticated requests', async () => {
    const ctx = buildContext({});
    await firstValueFrom(interceptor.intercept(ctx, handler(() => of({}))));
    expect(audit.record).not.toHaveBeenCalled();
  });

  it('logs allowed for successful authenticated requests', async () => {
    const ctx = buildContext({
      method: 'POST',
      url: '/api/tasks',
      user: {
        id: 'u1',
        email: 'a@x',
        role: RoleName.Admin,
        organizationId: 'org',
      },
    });
    await firstValueFrom(interceptor.intercept(ctx, handler(() => of({}))));
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({ outcome: 'allowed', action: 'create', resource: 'tasks' }),
    );
  });

  it('logs denied when handler throws 403', async () => {
    const ctx = buildContext({
      method: 'DELETE',
      url: '/api/tasks/abc',
      params: { id: 'abc' },
      user: { id: 'u', email: 'e', role: RoleName.Viewer, organizationId: 'org' },
    });

    const ran = firstValueFrom(
      interceptor.intercept(ctx, handler(() => throwError(() => new ForbiddenException()))),
    );

    await expect(ran).rejects.toBeInstanceOf(ForbiddenException);
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({ outcome: 'denied', action: 'delete', resourceId: 'abc' }),
    );
  });
});
