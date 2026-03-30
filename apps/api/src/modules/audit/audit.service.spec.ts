import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuditLog } from './audit-log.entity';
import { AuditService } from './audit.service';

describe('AuditService', () => {
  let service: AuditService;
  let repo: { create: jest.Mock; save: jest.Mock; find: jest.Mock };

  beforeEach(async () => {
    repo = {
      create: jest.fn((x) => x),
      save: jest.fn((x) => Promise.resolve({ id: 'log-id', ...x })),
      find: jest.fn(),
    };
    const module = await Test.createTestingModule({
      providers: [AuditService, { provide: getRepositoryToken(AuditLog), useValue: repo }],
    }).compile();
    service = module.get(AuditService);
  });

  it('persists an audit entry with allowed outcome', async () => {
    await service.record({
      userId: 'u1',
      userEmail: 'u@x',
      action: 'create',
      resource: 'tasks',
      outcome: 'allowed',
    });
    expect(repo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        outcome: 'allowed',
        action: 'create',
        resource: 'tasks',
        resourceId: null,
        organizationId: null,
      }),
    );
  });

  it('persists denied entries too', async () => {
    await service.record({
      userId: 'u1',
      userEmail: 'u@x',
      action: 'delete',
      resource: 'tasks',
      resourceId: 't1',
      organizationId: 'org-1',
      outcome: 'denied',
    });
    expect(repo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        outcome: 'denied',
        resourceId: 't1',
        organizationId: 'org-1',
      }),
    );
  });

  describe('list (paginated)', () => {
    const buildRow = (id: string) => ({
      id,
      userId: 'u',
      userEmail: 'e',
      action: 'read',
      resource: 'tasks',
      resourceId: null,
      organizationId: null,
      outcome: 'allowed' as const,
      createdAt: new Date('2026-01-01T00:00:00Z'),
    });

    it('returns the page and reports more pages when over-fetch hits', async () => {
      repo.find.mockResolvedValue([buildRow('1'), buildRow('2'), buildRow('3')]);
      const result = await service.list(0, 2);
      expect(result.items).toHaveLength(2);
      expect(result.hasMore).toBe(true);
      expect(result.nextOffset).toBe(2);
    });

    it('returns the final page with hasMore=false', async () => {
      repo.find.mockResolvedValue([buildRow('1'), buildRow('2')]);
      const result = await service.list(0, 5);
      expect(result.items).toHaveLength(2);
      expect(result.hasMore).toBe(false);
      expect(result.nextOffset).toBe(2);
    });

    it('forwards offset to the repository skip option', async () => {
      repo.find.mockResolvedValue([]);
      await service.list(40, 20);
      expect(repo.find).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 40, take: 21 }),
      );
    });
  });
});
