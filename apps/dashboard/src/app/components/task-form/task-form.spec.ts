import { TestBed } from '@angular/core/testing';
import { TaskCategory, TaskDto, TaskStatus } from '@app/data';
import { TaskForm } from './task-form';

const sample: TaskDto = {
  id: '1',
  title: 'Existing',
  description: 'desc',
  category: TaskCategory.Personal,
  status: TaskStatus.InProgress,
  position: 0,
  ownerId: 'u1',
  organizationId: 'org-1',
  createdAt: '',
  updatedAt: '',
};

describe('TaskForm', () => {
  it('starts in create mode with default values', () => {
    const fixture = TestBed.createComponent(TaskForm);
    fixture.componentRef.setInput('task', null);
    fixture.detectChanges();

    expect(fixture.componentInstance.mode()).toBe('create');
  });

  it('hydrates fields when editing an existing task', () => {
    const fixture = TestBed.createComponent(TaskForm);
    fixture.componentRef.setInput('task', sample);
    fixture.detectChanges();

    expect(fixture.componentInstance.mode()).toBe('edit');
  });

  it('reports a title-required error and blocks save on empty title', () => {
    const fixture = TestBed.createComponent(TaskForm);
    fixture.componentRef.setInput('task', null);
    fixture.detectChanges();

    const saveSpy = jest.fn();
    fixture.componentInstance.save.subscribe(saveSpy);

    fixture.componentInstance['title'].set('   ');
    fixture.componentInstance.submit();

    expect(saveSpy).not.toHaveBeenCalled();
    expect(fixture.componentInstance.titleError()).toBe('Title is required.');
    expect(fixture.componentInstance.isValid()).toBe(false);
  });

  it('reports a too-long description error', () => {
    const fixture = TestBed.createComponent(TaskForm);
    fixture.componentRef.setInput('task', null);
    fixture.detectChanges();

    fixture.componentInstance['title'].set('Valid title');
    fixture.componentInstance['description'].set('x'.repeat(2001));

    expect(fixture.componentInstance.descriptionError()).toMatch(/2000 characters/);
    expect(fixture.componentInstance.isValid()).toBe(false);
  });

  it('emits the trimmed payload when the form is valid', () => {
    const fixture = TestBed.createComponent(TaskForm);
    fixture.componentRef.setInput('task', null);
    fixture.detectChanges();

    const saveSpy = jest.fn();
    fixture.componentInstance.save.subscribe(saveSpy);

    fixture.componentInstance['title'].set('  Trim me  ');
    fixture.componentInstance['description'].set(' notes ');
    fixture.componentInstance['category'].set(TaskCategory.Work);
    fixture.componentInstance['status'].set(TaskStatus.Done);
    fixture.componentInstance.submit();

    expect(saveSpy).toHaveBeenCalledWith({
      title: 'Trim me',
      description: 'notes',
      category: TaskCategory.Work,
      status: TaskStatus.Done,
    });
  });
});
