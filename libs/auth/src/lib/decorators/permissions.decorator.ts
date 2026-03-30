import { SetMetadata } from '@nestjs/common';
import { PermissionAction } from '@app/data';

export const PERMISSIONS_KEY = 'permissions';

export const RequirePermissions = (...permissions: PermissionAction[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
