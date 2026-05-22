// backend/src/tasks/tasks.service.ts
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { DynamoService } from '../dynamo/dynamo.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { CloudWatchMetricsService } from '../common/cloudwatch-metrics.service';
import { isManager, STATUS_ORDER, TaskStatus } from '../common/types';

@Injectable()
export class TasksService {
  private readonly tableName =
    process.env.DYNAMODB_TASKS_TABLE || 'Mini-jira-Tasks';

  constructor(
    private readonly dynamo: DynamoService,
    private readonly auditLog: AuditLogService,
    private readonly metrics: CloudWatchMetricsService,
  ) {}

  async create(dto: CreateTaskDto, user: CurrentUserPayload) {
    const task = {
      taskId: uuidv4(),
      ...dto,
      status: 'TODO' as TaskStatus,
      createdBy: user.sub,
      createdByName: user.name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await this.dynamo.putItem(this.tableName, task);
    void this.metrics.taskCreated(dto.teamId);
    return task;
  }

  async findAll(user: CurrentUserPayload, teamId?: string) {
    const all = await this.dynamo.scan(this.tableName);

    if (isManager(user)) {
      if (teamId) return all.filter((t) => t.teamId === teamId);
      return all;
    }
    // Employee — always filter by their own teamId
    return all.filter((task) => task.teamId === user.teamId);
  }

  async findOne(taskId: string, user: CurrentUserPayload) {
    const task = await this.dynamo.getItem(this.tableName, { taskId });
    if (!task) throw new NotFoundException('Task not found');
    if (!isManager(user) && task.teamId !== user.teamId) {
      throw new ForbiddenException('You cannot access this task');
    }
    return task;
  }

  async update(taskId: string, dto: UpdateTaskDto, user: CurrentUserPayload) {
    await this.findOne(taskId, user); // validates access
    const updates = { ...dto, updatedAt: new Date().toISOString() };
    return this.dynamo.updateItem(this.tableName, { taskId }, updates);
  }

  async updateStatus(
    taskId: string,
    dto: UpdateTaskStatusDto,
    user: CurrentUserPayload,
  ) {
    const task = await this.findOne(taskId, user);
    const currentIndex = STATUS_ORDER.indexOf(task.status as TaskStatus);
    const newIndex = STATUS_ORDER.indexOf(dto.status);

    if (newIndex !== currentIndex + 1 && newIndex !== currentIndex - 1) {
      throw new BadRequestException(
        `Invalid status transition: ${task.status} → ${dto.status}`,
      );
    }

    const updated = await this.dynamo.updateItem(
      this.tableName,
      { taskId },
      { status: dto.status, updatedAt: new Date().toISOString() },
    );

    await this.auditLog.logStatusChange({
      taskId,
      changedBy: user.sub,
      changedByName: user.name,
      oldStatus: String(task.status),
      newStatus: dto.status,
    });

    if (dto.status === 'DONE') {
      const created = new Date(String(task.createdAt)).getTime();
      const seconds = Math.round((Date.now() - created) / 1000);
      void this.metrics.taskClosed(String(task.teamId), seconds);
    }

    return updated;
  }

  async remove(taskId: string, user: CurrentUserPayload) {
    if (!isManager(user)) {
      throw new ForbiddenException('Only managers can delete tasks');
    }
    await this.findOne(taskId, user);
    await this.dynamo.deleteItem(this.tableName, { taskId });
    return { message: 'Task deleted successfully' };
  }

  async getAuditLog(taskId: string, user: CurrentUserPayload) {
    await this.findOne(taskId, user); // validates access
    return this.auditLog.getLogsForTask(taskId);
  }
}
