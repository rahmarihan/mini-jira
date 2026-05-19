// backend/src/tasks/dto/update-task-status.dto.ts
import { IsEnum } from 'class-validator';
import { TaskStatus } from '../../common/types';

export class UpdateTaskStatusDto {
  @IsEnum(TaskStatus)
  status!: TaskStatus;
}