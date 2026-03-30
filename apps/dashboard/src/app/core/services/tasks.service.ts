import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { CreateTaskInput, TaskCategory, TaskDto, TaskStatus, UpdateTaskInput } from '@app/data';

export interface TaskFilters {
  search?: string;
  category?: TaskCategory;
  status?: TaskStatus;
}

@Injectable({ providedIn: 'root' })
export class TasksService {
  private readonly http = inject(HttpClient);

  private readonly _tasks = signal<TaskDto[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly tasks = this._tasks.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  readonly grouped = computed(() => {
    const buckets: Record<string, TaskDto[]> = { todo: [], in_progress: [], done: [] };
    for (const t of this._tasks()) buckets[t.status]?.push(t);
    return buckets;
  });

  async load(filters: TaskFilters = {}): Promise<void> {
    this._loading.set(true);
    this._error.set(null);
    let params = new HttpParams();
    if (filters.search) params = params.set('search', filters.search);
    if (filters.category) params = params.set('category', filters.category);
    if (filters.status) params = params.set('status', filters.status);

    try {
      const tasks = await firstValueFrom(
        this.http.get<TaskDto[]>('/api/tasks', { params }),
      );
      this._tasks.set(tasks);
    } catch (e: unknown) {
      this._error.set(this.errorMessage(e));
    } finally {
      this._loading.set(false);
    }
  }

  async create(input: CreateTaskInput): Promise<void> {
    const created = await firstValueFrom(
      this.http.post<TaskDto>('/api/tasks', input),
    );
    this._tasks.update((tasks) => [...tasks, created]);
  }

  async update(id: string, input: UpdateTaskInput): Promise<void> {
    const updated = await firstValueFrom(
      this.http.put<TaskDto>(`/api/tasks/${id}`, input),
    );
    this._tasks.update((tasks) => tasks.map((t) => (t.id === id ? updated : t)));
  }

  async remove(id: string): Promise<void> {
    await firstValueFrom(this.http.delete<void>(`/api/tasks/${id}`));
    this._tasks.update((tasks) => tasks.filter((t) => t.id !== id));
  }

  patchLocal(id: string, patch: Partial<TaskDto>): void {
    this._tasks.update((tasks) =>
      tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    );
  }

  private errorMessage(e: unknown): string {
    if (e && typeof e === 'object' && 'error' in e) {
      const err = (e as { error?: { message?: string | string[] } }).error;
      const msg = err?.message;
      if (Array.isArray(msg)) return msg.join(', ');
      if (msg) return msg;
    }
    return 'Something went wrong';
  }
}
