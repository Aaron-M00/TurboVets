import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, In, Repository } from 'typeorm';
import { PermissionAction, RoleName, TaskDto, TaskStatus } from '@app/data';
import type { AuthUser } from '@app/auth';
import { hasPermission } from '@app/auth';
import { Task } from './task.entity';
import { OrganizationsService } from '../organizations/organizations.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { ListTasksDto } from './dto/list-tasks.dto';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task) private readonly tasks: Repository<Task>,
    private readonly orgs: OrganizationsService,
  ) {}

  async list(user: AuthUser, filters: ListTasksDto = {}): Promise<TaskDto[]> {
    const orgIds =
      user.role === RoleName.Owner
        ? await this.orgs.accessibleOrgIds(user.organizationId)
        : [user.organizationId];

    const baseWhere = {
      organizationId: In(orgIds),
      ...(filters.category && { category: filters.category }),
      ...(filters.status && { status: filters.status }),
    };

    const search = filters.search?.trim();
    const where = search
      ? [
          { ...baseWhere, title: ILike(`%${search}%`) },
          { ...baseWhere, description: ILike(`%${search}%`) },
        ]
      : baseWhere;

    const rows = await this.tasks.find({
      where,
      order: { position: 'ASC', createdAt: 'DESC' },
    });

    return rows.map(toDto);
  }

  async create(user: AuthUser, dto: CreateTaskDto): Promise<TaskDto> {
    if (!hasPermission(user.role, PermissionAction.Create)) {
      throw new ForbiddenException('Cannot create tasks');
    }
    const task = this.tasks.create({
      title: dto.title,
      description: dto.description ?? '',
      category: dto.category,
      status: dto.status ?? TaskStatus.Todo,
      ownerId: user.id,
      organizationId: user.organizationId,
      position: await this.nextPosition(user.organizationId),
    });
    return toDto(await this.tasks.save(task));
  }

  async update(user: AuthUser, id: string, dto: UpdateTaskDto): Promise<TaskDto> {
    const task = await this.findAccessible(user, id);
    this.assertCanMutate(user, task);
    Object.assign(task, dto);
    return toDto(await this.tasks.save(task));
  }

  async remove(user: AuthUser, id: string): Promise<void> {
    const task = await this.findAccessible(user, id);
    this.assertCanMutate(user, task);
    await this.tasks.remove(task);
  }

  private async nextPosition(organizationId: string): Promise<number> {
    const last = await this.tasks.findOne({
      where: { organizationId },
      order: { position: 'DESC' },
    });
    return (last?.position ?? -1) + 1;
  }

  private async findAccessible(user: AuthUser, id: string): Promise<Task> {
    const task = await this.tasks.findOne({ where: { id } });
    if (!task) throw new NotFoundException('Task not found');

    const orgIds =
      user.role === RoleName.Owner
        ? await this.orgs.accessibleOrgIds(user.organizationId)
        : [user.organizationId];

    if (!orgIds.includes(task.organizationId)) {
      throw new NotFoundException('Task not found');
    }
    return task;
  }

  private assertCanMutate(user: AuthUser, task: Task) {
    if (user.role === RoleName.Viewer) {
      throw new ForbiddenException('Viewers cannot modify tasks');
    }
    if (user.role === RoleName.Admin && task.ownerId !== user.id) {
      throw new ForbiddenException('Admins can only modify their own tasks');
    }
  }
}

function toDto(t: Task): TaskDto {
  return {
    id: t.id,
    title: t.title,
    description: t.description,
    category: t.category,
    status: t.status,
    position: t.position,
    ownerId: t.ownerId,
    organizationId: t.organizationId,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  };
}
