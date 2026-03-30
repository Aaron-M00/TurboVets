import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { TaskCategory, TaskStatus } from '@app/data';

export class CreateTaskDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  title!: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @IsEnum(TaskCategory)
  category!: TaskCategory;

  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;
}
