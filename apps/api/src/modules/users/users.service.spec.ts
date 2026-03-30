import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './user.entity';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;
  let repo: { findOne: jest.Mock; create: jest.Mock; save: jest.Mock };

  beforeEach(async () => {
    repo = {
      findOne: jest.fn(),
      create: jest.fn((x) => x),
      save: jest.fn((x) => Promise.resolve({ id: 'new-id', ...x })),
    };
    const module = await Test.createTestingModule({
      providers: [UsersService, { provide: getRepositoryToken(User), useValue: repo }],
    }).compile();
    service = module.get(UsersService);
  });

  it('finds users by email', async () => {
    repo.findOne.mockResolvedValue({ id: '1', email: 'a@b' });
    const user = await service.findByEmail('a@b');
    expect(user?.email).toBe('a@b');
    expect(repo.findOne).toHaveBeenCalledWith({ where: { email: 'a@b' } });
  });

  it('finds users by id', async () => {
    repo.findOne.mockResolvedValue({ id: '1' });
    await service.findById('1');
    expect(repo.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
  });

  it('creates and saves a user', async () => {
    const result = await service.create({ email: 'x@y', name: 'X' });
    expect(repo.save).toHaveBeenCalled();
    expect(result.email).toBe('x@y');
  });
});
