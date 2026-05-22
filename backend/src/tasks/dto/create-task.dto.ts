// backend/src/tasks/dto/create-task.dto.ts
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsDateString,
} from 'class-validator';
import { Priority } from '../../common/types';

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsEnum(Priority)
  priority!: Priority;

  @IsDateString()
  deadline!: string;

  @IsString()
  @IsNotEmpty()
  assigneeId!: string;

  @IsString()
  @IsNotEmpty()
  assigneeName!: string;

  @IsString()
  @IsNotEmpty()
  teamId!: string;

  @IsString()
  @IsOptional()
  projectId?: string;

  @IsString()
  @IsOptional()
  imageKey?: string;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsString()
  @IsOptional()
  thumbnailKey?: string;

  @IsString()
  @IsOptional()
  thumbnailUrl?: string;
}
