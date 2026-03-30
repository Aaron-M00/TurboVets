import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuditLogPage } from '@app/data';
import { AuditService } from './audit.service';

const buildEntry = (id: string) => ({
  id,
  userId: 'u',
  userEmail: 'e@x',
  action: 'read',
  resource: 'tasks',
  resourceId: null,
  organizationId: null,
  outcome: 'allowed' as const,
  createdAt: new Date().toISOString(),
});

describe('AuditService', () => {
  let service: AuditService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuditService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loadFirst sends offset=0 and resets state', async () => {
    const promise = service.loadFirst();
    const req = http.expectOne((r) => r.url === '/api/audit-log');
    expect(req.request.params.get('offset')).toBe('0');
    const page: AuditLogPage = {
      items: [buildEntry('1'), buildEntry('2')],
      hasMore: true,
      nextOffset: 2,
    };
    req.flush(page);
    await promise;

    expect(service.logs()).toHaveLength(2);
    expect(service.hasMore()).toBe(true);
  });

  it('loadMore appends and uses the previous nextOffset', async () => {
    const first = service.loadFirst();
    http.expectOne((r) => r.url === '/api/audit-log').flush({
      items: [buildEntry('1'), buildEntry('2')],
      hasMore: true,
      nextOffset: 2,
    } as AuditLogPage);
    await first;

    const more = service.loadMore();
    const req = http.expectOne((r) => r.url === '/api/audit-log');
    expect(req.request.params.get('offset')).toBe('2');
    req.flush({
      items: [buildEntry('3')],
      hasMore: false,
      nextOffset: 3,
    } as AuditLogPage);
    await more;

    expect(service.logs().map((l) => l.id)).toEqual(['1', '2', '3']);
    expect(service.hasMore()).toBe(false);
  });

  it('loadMore is a no-op once hasMore is false', async () => {
    const first = service.loadFirst();
    http.expectOne((r) => r.url === '/api/audit-log').flush({
      items: [buildEntry('1')],
      hasMore: false,
      nextOffset: 1,
    } as AuditLogPage);
    await first;

    await service.loadMore();
    http.expectNone('/api/audit-log');
  });
});
