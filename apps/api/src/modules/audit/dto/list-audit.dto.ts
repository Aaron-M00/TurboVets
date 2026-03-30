import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class ListAuditDto {
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  offset = 0;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit = 20;
}
