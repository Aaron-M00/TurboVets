import { IsEnum, IsInt, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator';
import { TaskCategory, TaskStatus } from '@app/data';

export class UpdateTaskDto {
  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(120)
  title?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @IsEnum(TaskCategory)
  @IsOptional()
  category?: TaskCategory;

  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;

  @IsInt()
  @Min(0)
  @IsOptional()
  position?: number;
}
