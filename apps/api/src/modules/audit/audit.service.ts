import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './audit-log.entity';
import { AuditLogDto, AuditLogPage } from '@app/data';

interface RecordInput {
  userId: string;
  userEmail: string;
  action: string;
  resource: string;
  resourceId?: string | null;
  organizationId?: string | null;
  outcome: 'allowed' | 'denied';
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger('Audit');

  constructor(
    @InjectRepository(AuditLog) private readonly logs: Repository<AuditLog>,
  ) {}

  async record(input: RecordInput): Promise<void> {
    const entry = this.logs.create({
      ...input,
      resourceId: input.resourceId ?? null,
      organizationId: input.organizationId ?? null,
    });
    await this.logs.save(entry);
    this.logger.log(
      `${input.outcome.toUpperCase()} ${input.action} ${input.resource}${input.resourceId ? ':' + input.resourceId : ''} by ${input.userEmail}`,
    );
  }

  async list(offset = 0, limit = 20): Promise<AuditLogPage> {
    // take limit + 1 so we can tell whether more pages exist without a count query
    const rows = await this.logs.find({
      order: { createdAt: 'DESC', id: 'DESC' },
      skip: offset,
      take: limit + 1,
    });

    const hasMore = rows.length > limit;
    const slice = hasMore ? rows.slice(0, limit) : rows;

    return {
      items: slice.map(toDto),
      hasMore,
      nextOffset: offset + slice.length,
    };
  }
}

function toDto(r: AuditLog): AuditLogDto {
  return {
    id: r.id,
    userId: r.userId,
    userEmail: r.userEmail,
    action: r.action,
    resource: r.resource,
    resourceId: r.resourceId,
    organizationId: r.organizationId,
    outcome: r.outcome,
    createdAt: r.createdAt.toISOString(),
  };
}
