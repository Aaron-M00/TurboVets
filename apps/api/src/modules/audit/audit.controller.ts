import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, Roles, RolesGuard } from '@app/auth';
import { RoleName } from '@app/data';
import { AuditService } from './audit.service';
import { ListAuditDto } from './dto/list-audit.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('audit-log')
export class AuditController {
  constructor(private readonly audit: AuditService) {}

  @Get()
  @Roles(RoleName.Admin)
  list(@Query() query: ListAuditDto) {
    return this.audit.list(query.offset, query.limit);
  }
}
