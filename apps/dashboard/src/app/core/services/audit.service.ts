import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AuditLogDto, AuditLogPage } from '@app/data';

const PAGE_SIZE = 20;

@Injectable({ providedIn: 'root' })
export class AuditService {
  private readonly http = inject(HttpClient);

  private readonly _logs = signal<AuditLogDto[]>([]);
  private readonly _hasMore = signal(false);
  private readonly _loading = signal(false);
  private nextOffset = 0;

  readonly logs = this._logs.asReadonly();
  readonly hasMore = this._hasMore.asReadonly();
  readonly loading = this._loading.asReadonly();

  async loadFirst(): Promise<void> {
    this._logs.set([]);
    this.nextOffset = 0;
    this._hasMore.set(true);
    await this.loadMore();
  }

  async loadMore(): Promise<void> {
    if (this._loading() || !this._hasMore()) return;
    this._loading.set(true);
    try {
      const params = new HttpParams()
        .set('offset', this.nextOffset)
        .set('limit', PAGE_SIZE);
      const page = await firstValueFrom(
        this.http.get<AuditLogPage>('/api/audit-log', { params }),
      );
      this._logs.update((existing) => [...existing, ...page.items]);
      this._hasMore.set(page.hasMore);
      this.nextOffset = page.nextOffset;
    } finally {
      this._loading.set(false);
    }
  }
}
