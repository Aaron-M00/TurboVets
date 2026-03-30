import { Component, HostListener, OnDestroy, computed, effect, inject, signal } from '@angular/core';
import { CdkDragDrop, DragDropModule, transferArrayItem, moveItemInArray } from '@angular/cdk/drag-drop';
import { CreateTaskInput, TaskCategory, TaskDto, TaskStatus, UpdateTaskInput } from '@app/data';
import { AuthService } from '../../core/services/auth.service';
import { TaskFilters, TasksService } from '../../core/services/tasks.service';
import { ThemeService } from '../../core/services/theme.service';
import { TaskCard } from '../../components/task-card/task-card';
import { TaskForm } from '../../components/task-form/task-form';
import { AuditPanel } from '../../components/audit-panel/audit-panel';

const COLUMNS: Array<{ id: TaskStatus; title: string }> = [
  { id: TaskStatus.Todo, title: 'To do' },
  { id: TaskStatus.InProgress, title: 'In progress' },
  { id: TaskStatus.Done, title: 'Done' },
];

const SEARCH_DEBOUNCE_MS = 250;

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [DragDropModule, TaskCard, TaskForm, AuditPanel],
  templateUrl: './dashboard.html',
})
export class DashboardPage implements OnDestroy {
  protected readonly auth = inject(AuthService);
  protected readonly tasks = inject(TasksService);
  protected readonly theme = inject(ThemeService);

  protected readonly columns = COLUMNS;
  protected readonly columnIds = COLUMNS.map((c) => c.id);
  protected readonly TaskCategory = TaskCategory;

  protected readonly categoryFilter = signal<'all' | TaskCategory>('all');
  protected readonly searchTerm = signal('');
  protected readonly editing = signal<TaskDto | null>(null);
  protected readonly showForm = signal(false);
  protected readonly showAudit = signal(false);

  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  protected readonly visibleByColumn = computed(() => {
    const buckets: Record<TaskStatus, TaskDto[]> = {
      [TaskStatus.Todo]: [],
      [TaskStatus.InProgress]: [],
      [TaskStatus.Done]: [],
    };
    for (const t of this.tasks.tasks()) buckets[t.status].push(t);
    return buckets;
  });

  protected readonly counts = computed(() => {
    const all = this.tasks.tasks();
    return {
      total: all.length,
      done: all.filter((t) => t.status === TaskStatus.Done).length,
      inProgress: all.filter((t) => t.status === TaskStatus.InProgress).length,
      todo: all.filter((t) => t.status === TaskStatus.Todo).length,
    };
  });

  protected readonly progress = computed(() => {
    const c = this.counts();
    return c.total === 0 ? 0 : Math.round((c.done / c.total) * 100);
  });

  constructor() {
    void this.tasks.load();

    effect(() => {
      const cat = this.categoryFilter();
      this.categoryFilter();
      void this.reload({ category: cat === 'all' ? undefined : cat });
    });
  }

  ngOnDestroy(): void {
    if (this.searchTimer) clearTimeout(this.searchTimer);
  }

  onSearchInput(value: string): void {
    this.searchTerm.set(value);
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => this.reload(), SEARCH_DEBOUNCE_MS);
  }

  private reload(override: Partial<TaskFilters> = {}): Promise<void> {
    const cat = this.categoryFilter();
    return this.tasks.load({
      search: this.searchTerm().trim() || undefined,
      category: override.category ?? (cat === 'all' ? undefined : cat),
      ...override,
    });
  }

  openCreate(): void {
    this.editing.set(null);
    this.showForm.set(true);
  }

  openEdit(task: TaskDto): void {
    this.editing.set(task);
    this.showForm.set(true);
  }

  async handleSave(input: CreateTaskInput | UpdateTaskInput): Promise<void> {
    const editing = this.editing();
    try {
      if (editing) await this.tasks.update(editing.id, input);
      else await this.tasks.create(input as CreateTaskInput);
      this.showForm.set(false);
      this.editing.set(null);
    } catch (e) {
      console.error(e);
    }
  }

  async handleDelete(task: TaskDto): Promise<void> {
    if (!confirm(`Delete "${task.title}"?`)) return;
    await this.tasks.remove(task.id);
  }

  async handleDrop(event: CdkDragDrop<TaskDto[]>, target: TaskStatus): Promise<void> {
    if (!this.auth.canMutate()) return;
    const task = event.item.data as TaskDto;
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      const newPos = event.currentIndex;
      if (newPos !== task.position) {
        this.tasks.patchLocal(task.id, { position: newPos });
        await this.tasks.update(task.id, { position: newPos });
      }
      return;
    }

    transferArrayItem(
      event.previousContainer.data,
      event.container.data,
      event.previousIndex,
      event.currentIndex,
    );
    this.tasks.patchLocal(task.id, { status: target });
    await this.tasks.update(task.id, { status: target });
  }

  @HostListener('document:keydown', ['$event'])
  protected onKeydown(event: KeyboardEvent): void {
    const target = event.target as HTMLElement | null;
    const inField =
      target?.tagName === 'INPUT' ||
      target?.tagName === 'TEXTAREA' ||
      target?.tagName === 'SELECT' ||
      target?.isContentEditable;

    if (event.key === 'Escape') {
      if (this.showForm()) this.showForm.set(false);
      else if (this.showAudit()) this.showAudit.set(false);
      return;
    }

    if (inField) return;

    if (event.key === '/') {
      event.preventDefault();
      const input = document.querySelector<HTMLInputElement>('input[type="search"]');
      input?.focus();
    } else if (event.key === 'n' && this.auth.canMutate() && !this.showForm()) {
      event.preventDefault();
      this.openCreate();
    } else if ((event.key === 'd' || event.key === 't') && event.shiftKey) {
      event.preventDefault();
      this.theme.toggle();
    }
  }
}
