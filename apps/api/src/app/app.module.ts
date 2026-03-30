import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { buildDatabaseConfig } from '../config/database.config';
import { AuthModule } from '../modules/auth/auth.module';
import { UsersModule } from '../modules/users/users.module';
import { OrganizationsModule } from '../modules/organizations/organizations.module';
import { TasksModule } from '../modules/tasks/tasks.module';
import { AuditModule } from '../modules/audit/audit.module';
import { AuditInterceptor } from '../modules/audit/audit.interceptor';
import { SeedModule } from '../modules/seed/seed.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: buildDatabaseConfig,
    }),
    AuditModule,
    UsersModule,
    OrganizationsModule,
    AuthModule,
    TasksModule,
    SeedModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
})
export class AppModule {}
