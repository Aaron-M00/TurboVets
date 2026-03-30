import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Organization } from './organization.entity';
import { OrganizationsService } from './organizations.service';

describe('OrganizationsService', () => {
  let service: OrganizationsService;
  let repo: { find: jest.Mock; findOne: jest.Mock };

  beforeEach(async () => {
    repo = { find: jest.fn(), findOne: jest.fn() };
    const module = await Test.createTestingModule({
      providers: [
        OrganizationsService,
        { provide: getRepositoryToken(Organization), useValue: repo },
      ],
    }).compile();
    service = module.get(OrganizationsService);
  });

  describe('accessibleOrgIds', () => {
    it('returns root + direct children for the 2-level hierarchy', async () => {
      repo.find.mockResolvedValue([{ id: 'child-1' }, { id: 'child-2' }]);
      const result = await service.accessibleOrgIds('root');
      expect(result).toEqual(['root', 'child-1', 'child-2']);
      expect(repo.find).toHaveBeenCalledWith({ where: { parentId: 'root' } });
    });

    it('returns just the root when there are no children', async () => {
      repo.find.mockResolvedValue([]);
      expect(await service.accessibleOrgIds('only')).toEqual(['only']);
    });
  });

  describe('findByIds', () => {
    it('short-circuits on an empty array', async () => {
      const result = await service.findByIds([]);
      expect(result).toEqual([]);
      expect(repo.find).not.toHaveBeenCalled();
    });

    it('queries when ids are provided', async () => {
      repo.find.mockResolvedValue([{ id: 'a' }]);
      await service.findByIds(['a', 'b']);
      expect(repo.find).toHaveBeenCalled();
    });
  });
});
