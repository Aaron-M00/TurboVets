import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { TaskCategory, TaskStatus } from '@app/data';

export class ListTasksDto {
  @IsString()
  @IsOptional()
  @MaxLength(120)
  search?: string;

  @IsEnum(TaskCategory)
  @IsOptional()
  category?: TaskCategory;

  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;
}
