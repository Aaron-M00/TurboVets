import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  CurrentUser,
  JwtAuthGuard,
  RequirePermissions,
  RolesGuard,
} from '@app/auth';
import type { AuthUser } from '@app/auth';
import { PermissionAction } from '@app/data';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { ListTasksDto } from './dto/list-tasks.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasks: TasksService) {}

  @Get()
  @RequirePermissions(PermissionAction.Read)
  list(@CurrentUser() user: AuthUser, @Query() query: ListTasksDto) {
    return this.tasks.list(user, query);
  }

  @Post()
  @RequirePermissions(PermissionAction.Create)
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateTaskDto) {
    return this.tasks.create(user, dto);
  }

  @Put(':id')
  @RequirePermissions(PermissionAction.Update)
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.tasks.update(user, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @RequirePermissions(PermissionAction.Delete)
  remove(
    @CurrentUser() user: AuthUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.tasks.remove(user, id);
  }
}
