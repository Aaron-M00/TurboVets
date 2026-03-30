import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionAction, RoleName } from '@app/data';
import { ROLES_KEY } from '../decorators/roles.decorator.js';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator.js';
import { hasPermission, roleAtLeast } from '../role.helper.js';
import type { AuthUser } from '../types.js';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<RoleName[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const requiredPermissions = this.reflector.getAllAndOverride<PermissionAction[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles?.length && !requiredPermissions?.length) return true;

    const user: AuthUser | undefined = context.switchToHttp().getRequest().user;
    if (!user) return false;

    if (requiredRoles?.length) {
      const ok = requiredRoles.some((min) => roleAtLeast(user.role, min));
      if (!ok) return false;
    }

    if (requiredPermissions?.length) {
      const ok = requiredPermissions.every((p) => hasPermission(user.role, p));
      if (!ok) return false;
    }

    return true;
  }
}
