import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionAction, RoleName } from '@app/data';
import { RolesGuard } from './roles.guard';
import type { AuthUser } from '../types';

function buildContext(user?: AuthUser): ExecutionContext {
  const handler = () => undefined;
  const cls = class {};
  return {
    getHandler: () => handler,
    getClass: () => cls,
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
}

const owner: AuthUser = { id: '1', email: 'o@x', role: RoleName.Owner, organizationId: 'a' };
const admin: AuthUser = { id: '2', email: 'a@x', role: RoleName.Admin, organizationId: 'a' };
const viewer: AuthUser = { id: '3', email: 'v@x', role: RoleName.Viewer, organizationId: 'a' };

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  it('allows when no metadata is set', () => {
    expect(guard.canActivate(buildContext(viewer))).toBe(true);
  });

  it('denies viewer when create permission required', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockImplementation((key: string) =>
        key === 'permissions' ? [PermissionAction.Create] : undefined,
      );
    expect(guard.canActivate(buildContext(viewer))).toBe(false);
    expect(guard.canActivate(buildContext(admin))).toBe(true);
  });

  it('enforces minimum role for audit access', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockImplementation((key: string) =>
        key === 'roles' ? [RoleName.Admin] : undefined,
      );
    expect(guard.canActivate(buildContext(viewer))).toBe(false);
    expect(guard.canActivate(buildContext(admin))).toBe(true);
    expect(guard.canActivate(buildContext(owner))).toBe(true);
  });

  it('denies anonymous requests when metadata is set', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockImplementation((key: string) =>
        key === 'permissions' ? [PermissionAction.Read] : undefined,
      );
    expect(guard.canActivate(buildContext())).toBe(false);
  });
});
