import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TaskCategory, TaskDto, TaskStatus } from '@app/data';
import { TasksService } from './tasks.service';

const sample: TaskDto = {
  id: '1',
  title: 'Wire up backend',
  description: '',
  category: TaskCategory.Work,
  status: TaskStatus.Todo,
  position: 0,
  ownerId: 'u1',
  organizationId: 'org-1',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe('TasksService', () => {
  let service: TasksService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(TasksService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads and groups tasks by status', async () => {
    const promise = service.load();
    const req = http.expectOne((r) => r.url === '/api/tasks');
    expect(req.request.params.keys().length).toBe(0);
    req.flush([sample, { ...sample, id: '2', status: TaskStatus.Done }]);
    await promise;
    expect(service.tasks()).toHaveLength(2);
    expect(service.grouped()['todo']).toHaveLength(1);
    expect(service.grouped()['done']).toHaveLength(1);
  });

  it('passes filters as query params', async () => {
    const promise = service.load({ search: 'foo', category: TaskCategory.Work, status: TaskStatus.Done });
    const req = http.expectOne((r) => r.url === '/api/tasks');
    expect(req.request.params.get('search')).toBe('foo');
    expect(req.request.params.get('category')).toBe(TaskCategory.Work);
    expect(req.request.params.get('status')).toBe(TaskStatus.Done);
    req.flush([]);
    await promise;
  });

  it('appends a created task to local state', async () => {
    const promise = service.create({ title: 'New', category: TaskCategory.Work });
    http
      .expectOne('/api/tasks')
      .flush({ ...sample, id: '99', title: 'New' });
    await promise;
    expect(service.tasks().map((t) => t.id)).toContain('99');
  });

  it('removes a task from local state on delete', async () => {
    service.patchLocal('1', {});
    (service as unknown as { _tasks: { set: (v: TaskDto[]) => void } })._tasks.set([sample]);
    const promise = service.remove('1');
    http.expectOne('/api/tasks/1').flush(null);
    await promise;
    expect(service.tasks()).toHaveLength(0);
  });
});
