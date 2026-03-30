import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { PermissionAction, RoleName } from '@app/data';
import { permissionsFor } from '@app/auth';
import { Organization } from '../organizations/organization.entity';
import { Permission } from '../roles/permission.entity';
import { Role } from '../roles/role.entity';
import { User } from '../users/user.entity';

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger('Seed');

  constructor(
    private readonly config: ConfigService,
    @InjectRepository(Organization) private readonly orgs: Repository<Organization>,
    @InjectRepository(Role) private readonly roles: Repository<Role>,
    @InjectRepository(Permission) private readonly perms: Repository<Permission>,
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {}

  async onApplicationBootstrap() {
    if (this.config.get<string>('SEED_ON_BOOT', 'true') !== 'true') return;
    if ((await this.users.count()) > 0) return;

    this.logger.log('Seeding initial data...');

    const allActions = Object.values(PermissionAction);
    const permissionMap = new Map<string, Permission>();
    for (const action of allActions) {
      permissionMap.set(action, await this.perms.save(this.perms.create({ action })));
    }

    const roleMap = new Map<RoleName, Role>();
    for (const name of Object.values(RoleName)) {
      const actions = permissionsFor(name);
      const role = await this.roles.save(
        this.roles.create({
          name,
          permissions: actions.map((a) => permissionMap.get(a)!).filter(Boolean),
        }),
      );
      roleMap.set(name, role);
    }

    const acme = await this.orgs.save(this.orgs.create({ name: 'Acme', parentId: null }));
    const acmeWest = await this.orgs.save(
      this.orgs.create({ name: 'Acme West', parentId: acme.id }),
    );

    const password = await bcrypt.hash('password123', 10);
    await this.users.save([
      this.users.create({
        email: 'owner@acme.test',
        passwordHash: password,
        name: 'Olivia Owner',
        organizationId: acmeWest.id,
        roleId: roleMap.get(RoleName.Owner)!.id,
      }),
      this.users.create({
        email: 'admin@acme.test',
        passwordHash: password,
        name: 'Adam Admin',
        organizationId: acmeWest.id,
        roleId: roleMap.get(RoleName.Admin)!.id,
      }),
      this.users.create({
        email: 'viewer@acme.test',
        passwordHash: password,
        name: 'Vera Viewer',
        organizationId: acmeWest.id,
        roleId: roleMap.get(RoleName.Viewer)!.id,
      }),
    ]);

    this.logger.log('Seed complete. Login with owner@acme.test / admin@acme.test / viewer@acme.test (password: password123)');
  }
}
