import { ComponentRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TaskCategory, TaskDto, TaskStatus } from '@app/data';
import { TaskCard } from './task-card';

const sample: TaskDto = {
  id: '1',
  title: 'Ship feature',
  description: 'Wire up the API.',
  category: TaskCategory.Work,
  status: TaskStatus.Todo,
  position: 0,
  ownerId: 'u1',
  organizationId: 'org-1',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

describe('TaskCard', () => {
  let ref: ComponentRef<TaskCard>;

  beforeEach(() => {
    const fixture = TestBed.createComponent(TaskCard);
    ref = fixture.componentRef;
  });

  it('exposes a Work label and matching color', () => {
    ref.setInput('task', sample);
    ref.setInput('canMutate', false);
    expect(ref.instance.categoryLabel()).toBe('Work');
    expect(ref.instance.categoryColor()).toMatch(/emerald/);
  });

  it('exposes a Personal label and matching color', () => {
    ref.setInput('task', { ...sample, category: TaskCategory.Personal });
    ref.setInput('canMutate', false);
    expect(ref.instance.categoryLabel()).toBe('Personal');
    expect(ref.instance.categoryColor()).toMatch(/violet/);
  });

  it('emits edit and remove events', () => {
    ref.setInput('task', sample);
    ref.setInput('canMutate', true);
    const editSpy = jest.fn();
    const removeSpy = jest.fn();
    ref.instance.edit.subscribe(editSpy);
    ref.instance.remove.subscribe(removeSpy);

    ref.instance.edit.emit(sample);
    ref.instance.remove.emit(sample);

    expect(editSpy).toHaveBeenCalledWith(sample);
    expect(removeSpy).toHaveBeenCalledWith(sample);
  });
});
