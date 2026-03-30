import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Organization } from '../modules/organizations/organization.entity';
import { Role } from '../modules/roles/role.entity';
import { Permission } from '../modules/roles/permission.entity';
import { User } from '../modules/users/user.entity';
import { Task } from '../modules/tasks/task.entity';
import { AuditLog } from '../modules/audit/audit-log.entity';

export const buildDatabaseConfig = (config: ConfigService): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: config.get<string>('DB_HOST', 'localhost'),
  port: config.get<number>('DB_PORT', 5432),
  username: config.get<string>('DB_USER', 'postgres'),
  password: config.get<string>('DB_PASSWORD', 'postgres'),
  database: config.get<string>('DB_NAME', 'taskmgr'),
  entities: [Organization, Role, Permission, User, Task, AuditLog],
  synchronize: config.get<string>('DB_SYNC', 'true') === 'true',
  logging: config.get<string>('DB_LOGGING', 'false') === 'true',
});
