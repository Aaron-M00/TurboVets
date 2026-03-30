import { PermissionAction, RoleName } from '@app/data';

const ROLE_PERMISSIONS: Record<RoleName, PermissionAction[]> = {
  [RoleName.Viewer]: [PermissionAction.Read],
  [RoleName.Admin]: [
    PermissionAction.Read,
    PermissionAction.Create,
    PermissionAction.Update,
    PermissionAction.Delete,
    PermissionAction.ViewAudit,
  ],
  [RoleName.Owner]: [
    PermissionAction.Read,
    PermissionAction.Create,
    PermissionAction.Update,
    PermissionAction.Delete,
    PermissionAction.ViewAudit,
  ],
};

const ROLE_RANK: Record<RoleName, number> = {
  [RoleName.Viewer]: 1,
  [RoleName.Admin]: 2,
  [RoleName.Owner]: 3,
};

export function permissionsFor(role: RoleName): PermissionAction[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

export function hasPermission(role: RoleName, action: PermissionAction): boolean {
  return permissionsFor(role).includes(action);
}

export function rankOf(role: RoleName): number {
  return ROLE_RANK[role];
}

export function roleAtLeast(role: RoleName, minimum: RoleName): boolean {
  return rankOf(role) >= rankOf(minimum);
}
