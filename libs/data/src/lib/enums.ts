export enum RoleName {
  Owner = 'owner',
  Admin = 'admin',
  Viewer = 'viewer',
}

export enum TaskStatus {
  Todo = 'todo',
  InProgress = 'in_progress',
  Done = 'done',
}

export enum TaskCategory {
  Work = 'work',
  Personal = 'personal',
}

export enum PermissionAction {
  Create = 'task:create',
  Read = 'task:read',
  Update = 'task:update',
  Delete = 'task:delete',
  ViewAudit = 'audit:read',
}
