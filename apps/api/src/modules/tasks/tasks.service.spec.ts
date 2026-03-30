import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { RoleName, TaskCategory, TaskStatus } from '@app/data';
import type { AuthUser } from '@app/auth';
import { Task } from './task.entity';
import { TasksService } from './tasks.service';
import { OrganizationsService } from '../organizations/organizations.service';

const makeTask = (overrides: Partial<Task> = {}): Task => ({
  id: overrides.id ?? 't1',
  title: 'Title',
  description: '',
  category: TaskCategory.Work,
  status: TaskStatus.Todo,
  position: 0,
  ownerId: 'user-1',
  organizationId: 'org-parent',
  owner: undefined as never,
  organization: undefined as never,
  createdAt: new Date('2025-01-01T00:00:00Z'),
  updatedAt: new Date('2025-01-01T00:00:00Z'),
  ...overrides,
});

const owner: AuthUser = {
  id: 'user-owner',
  email: 'o@x',
  role: RoleName.Owner,
  organizationId: 'org-parent',
};
const admin: AuthUser = {
  id: 'user-admin',
  email: 'a@x',
  role: RoleName.Admin,
  organizationId: 'org-child',
};
const viewer: AuthUser = {
  id: 'user-viewer',
  email: 'v@x',
  role: RoleName.Viewer,
  organizationId: 'org-child',
};

describe('TasksService', () => {
  let service: TasksService;
  let repo: { find: jest.Mock; findOne: jest.Mock; create: jest.Mock; save: jest.Mock; remove: jest.Mock };
  let orgs: { accessibleOrgIds: jest.Mock };

  beforeEach(async () => {
    repo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn((x) => x),
      save: jest.fn((x) =>
        Promise.resolve({
          ...x,
          id: x.id ?? 'new-id',
          createdAt: x.createdAt ?? new Date('2025-01-01T00:00:00Z'),
          updatedAt: x.updatedAt ?? new Date('2025-01-01T00:00:00Z'),
        }),
      ),
      remove: jest.fn(),
    };
    orgs = {
      accessibleOrgIds: jest.fn().mockResolvedValue(['org-parent', 'org-child']),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: getRepositoryToken(Task), useValue: repo },
        { provide: OrganizationsService, useValue: orgs },
      ],
    }).compile();

    service = module.get(TasksService);
  });

  describe('list', () => {
    it('owners see tasks across the org and its children', async () => {
      repo.find.mockResolvedValue([
        makeTask({ id: '1', organizationId: 'org-parent' }),
        makeTask({ id: '2', organizationId: 'org-child' }),
      ]);
      const result = await service.list(owner);
      expect(orgs.accessibleOrgIds).toHaveBeenCalledWith('org-parent');
      expect(result).toHaveLength(2);
    });

    it('admins see all tasks within their own org', async () => {
      repo.find.mockResolvedValue([
        makeTask({ id: '1', organizationId: 'org-child', ownerId: 'someone-else' }),
      ]);
      const result = await service.list(admin);
      expect(orgs.accessibleOrgIds).not.toHaveBeenCalled();
      expect(result).toHaveLength(1);
    });

    it('viewers see all tasks in their own org (read-only)', async () => {
      repo.find.mockResolvedValue([
        makeTask({ id: '1', ownerId: 'user-viewer', organizationId: viewer.organizationId }),
        makeTask({ id: '2', ownerId: 'someone-else', organizationId: viewer.organizationId }),
      ]);
      const result = await service.list(viewer);
      expect(orgs.accessibleOrgIds).not.toHaveBeenCalled();
      expect(result.map((t) => t.id)).toEqual(['1', '2']);
    });
  });

  describe('create', () => {
    it('blocks viewers', async () => {
      await expect(
        service.create(viewer, { title: 'x', category: TaskCategory.Work }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('admins create tasks owned by themselves in their org', async () => {
      repo.findOne.mockResolvedValue(null);
      const result = await service.create(admin, { title: 'New', category: TaskCategory.Personal });
      expect(result.ownerId).toBe(admin.id);
      expect(result.organizationId).toBe(admin.organizationId);
    });
  });

  describe('update', () => {
    it('viewers cannot update', async () => {
      repo.findOne.mockResolvedValue(makeTask({ ownerId: viewer.id, organizationId: viewer.organizationId }));
      await expect(service.update(viewer, 't1', { title: 'x' })).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('admins can only update their own tasks', async () => {
      repo.findOne.mockResolvedValue(
        makeTask({ ownerId: 'someone-else', organizationId: admin.organizationId }),
      );
      await expect(service.update(admin, 't1', { title: 'x' })).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('owners can update tasks in any accessible org', async () => {
      repo.findOne.mockResolvedValue(
        makeTask({ ownerId: 'someone-else', organizationId: 'org-child' }),
      );
      const result = await service.update(owner, 't1', { title: 'New title' });
      expect(result.title).toBe('New title');
    });

    it('hides tasks outside the accessible org with 404', async () => {
      repo.findOne.mockResolvedValue(makeTask({ organizationId: 'unrelated-org' }));
      await expect(service.update(admin, 't1', { title: 'x' })).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('owners can remove any accessible task', async () => {
      const task = makeTask({ organizationId: 'org-child' });
      repo.findOne.mockResolvedValue(task);
      await service.remove(owner, task.id);
      expect(repo.remove).toHaveBeenCalledWith(task);
    });
  });
});
