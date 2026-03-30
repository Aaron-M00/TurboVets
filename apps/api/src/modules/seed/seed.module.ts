import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Organization } from '../organizations/organization.entity';
import { Role } from '../roles/role.entity';
import { Permission } from '../roles/permission.entity';
import { User } from '../users/user.entity';
import { SeedService } from './seed.service';

@Module({
  imports: [TypeOrmModule.forFeature([Organization, Role, Permission, User])],
  providers: [SeedService],
})
export class SeedModule {}
