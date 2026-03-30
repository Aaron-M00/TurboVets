import { PermissionAction, RoleName } from '@app/data';
import { hasPermission, permissionsFor, rankOf, roleAtLeast } from './role.helper';

describe('role helper', () => {
  it('viewer can only read tasks', () => {
    expect(permissionsFor(RoleName.Viewer)).toEqual([PermissionAction.Read]);
  });

  it('admin can manage tasks and view audit log', () => {
    const perms = permissionsFor(RoleName.Admin);
    expect(perms).toContain(PermissionAction.Create);
    expect(perms).toContain(PermissionAction.Update);
    expect(perms).toContain(PermissionAction.Delete);
    expect(perms).toContain(PermissionAction.ViewAudit);
  });

  it('owner inherits everything an admin can do', () => {
    for (const p of permissionsFor(RoleName.Admin)) {
      expect(hasPermission(RoleName.Owner, p)).toBe(true);
    }
  });

  it('roleAtLeast respects rank order', () => {
    expect(rankOf(RoleName.Owner)).toBeGreaterThan(rankOf(RoleName.Admin));
    expect(rankOf(RoleName.Admin)).toBeGreaterThan(rankOf(RoleName.Viewer));
    expect(roleAtLeast(RoleName.Owner, RoleName.Admin)).toBe(true);
    expect(roleAtLeast(RoleName.Viewer, RoleName.Admin)).toBe(false);
  });
});
