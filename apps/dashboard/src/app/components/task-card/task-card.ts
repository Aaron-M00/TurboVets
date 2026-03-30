import { Component, computed, input, output } from '@angular/core';
import { TaskCategory, TaskDto } from '@app/data';

@Component({
  selector: 'app-task-card',
  standalone: true,
  templateUrl: './task-card.html',
})
export class TaskCard {
  readonly task = input.required<TaskDto>();
  readonly canMutate = input<boolean>(false);

  readonly edit = output<TaskDto>();
  readonly remove = output<TaskDto>();

  readonly categoryLabel = computed(() =>
    this.task().category === TaskCategory.Work ? 'Work' : 'Personal',
  );
  readonly categoryColor = computed(() =>
    this.task().category === TaskCategory.Work
      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
      : 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
  );
}
