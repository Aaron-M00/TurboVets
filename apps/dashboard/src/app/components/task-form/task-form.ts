import { Component, computed, effect, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CreateTaskInput, TaskCategory, TaskDto, TaskStatus, UpdateTaskInput } from '@app/data';

const TITLE_MAX = 120;
const DESCRIPTION_MAX = 2000;

@Component({
  selector: 'app-task-form',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './task-form.html',
})
export class TaskForm {
  readonly task = input<TaskDto | null>(null);
  readonly save = output<CreateTaskInput | UpdateTaskInput>();
  readonly cancel = output<void>();

  protected readonly TaskCategory = TaskCategory;
  protected readonly TaskStatus = TaskStatus;
  protected readonly TITLE_MAX = TITLE_MAX;
  protected readonly DESCRIPTION_MAX = DESCRIPTION_MAX;

  protected readonly title = signal('');
  protected readonly description = signal('');
  protected readonly category = signal<TaskCategory>(TaskCategory.Work);
  protected readonly status = signal<TaskStatus>(TaskStatus.Todo);
  protected readonly submitted = signal(false);

  readonly mode = computed(() => (this.task() ? 'edit' : 'create'));

  readonly titleError = computed<string | null>(() => {
    const v = this.title().trim();
    if (!v) return 'Title is required.';
    if (v.length > TITLE_MAX) return `Title must be ${TITLE_MAX} characters or fewer.`;
    return null;
  });

  readonly descriptionError = computed<string | null>(() => {
    if (this.description().length > DESCRIPTION_MAX) {
      return `Description must be ${DESCRIPTION_MAX} characters or fewer.`;
    }
    return null;
  });

  readonly isValid = computed(() => !this.titleError() && !this.descriptionError());

  constructor() {
    effect(() => {
      const t = this.task();
      this.title.set(t?.title ?? '');
      this.description.set(t?.description ?? '');
      this.category.set(t?.category ?? TaskCategory.Work);
      this.status.set(t?.status ?? TaskStatus.Todo);
      this.submitted.set(false);
    });
  }

  submit(): void {
    this.submitted.set(true);
    if (!this.isValid()) return;
    this.save.emit({
      title: this.title().trim(),
      description: this.description().trim(),
      category: this.category(),
      status: this.status(),
    });
  }
}
