import { Test } from '@nestjs/testing';
import { RoleName, TaskCategory } from '@app/data';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';

const user = {
  id: 'u',
  email: 'a@b',
  role: RoleName.Admin,
  organizationId: 'org',
};

describe('TasksController', () => {
  let controller: TasksController;
  let service: { list: jest.Mock; create: jest.Mock; update: jest.Mock; remove: jest.Mock };

  beforeEach(async () => {
    service = {
      list: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockResolvedValue({}),
      update: jest.fn().mockResolvedValue({}),
      remove: jest.fn().mockResolvedValue(undefined),
    };
    const module = await Test.createTestingModule({
      controllers: [TasksController],
      providers: [{ provide: TasksService, useValue: service }],
    }).compile();
    controller = module.get(TasksController);
  });

  it('list delegates to TasksService with the query filters', async () => {
    const filters = { search: 'foo' };
    await controller.list(user, filters);
    expect(service.list).toHaveBeenCalledWith(user, filters);
  });

  it('create forwards user + dto', async () => {
    const dto = { title: 'X', category: TaskCategory.Work };
    await controller.create(user, dto);
    expect(service.create).toHaveBeenCalledWith(user, dto);
  });

  it('update forwards id and dto', async () => {
    await controller.update(user, 't1', { title: 'New' });
    expect(service.update).toHaveBeenCalledWith(user, 't1', { title: 'New' });
  });

  it('remove forwards id', async () => {
    await controller.remove(user, 't1');
    expect(service.remove).toHaveBeenCalledWith(user, 't1');
  });
});
