import { RoleName, TaskCategory, TaskStatus } from './enums.js';

export interface OrganizationDto {
  id: string;
  name: string;
  parentId: string | null;
}

export interface UserDto {
  id: string;
  email: string;
  name: string;
  role: RoleName;
  organizationId: string;
}

export interface AuthResponse {
  token: string;
  user: UserDto;
}

export interface TaskDto {
  id: string;
  title: string;
  description: string;
  category: TaskCategory;
  status: TaskStatus;
  position: number;
  ownerId: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLogDto {
  id: string;
  userId: string;
  userEmail: string;
  action: string;
  resource: string;
  resourceId: string | null;
  organizationId: string | null;
  outcome: 'allowed' | 'denied';
  createdAt: string;
}

export interface AuditLogPage {
  items: AuditLogDto[];
  hasMore: boolean;
  nextOffset: number;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  category: TaskCategory;
  status?: TaskStatus;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  category?: TaskCategory;
  status?: TaskStatus;
  position?: number;
}

export interface LoginInput {
  email: string;
  password: string;
}
