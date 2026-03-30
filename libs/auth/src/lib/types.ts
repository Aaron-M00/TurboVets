import { RoleName } from '@app/data';

export interface JwtPayload {
  sub: string;
  email: string;
  role: RoleName;
  organizationId: string;
}

export interface AuthUser {
  id: string;
  email: string;
  role: RoleName;
  organizationId: string;
}
