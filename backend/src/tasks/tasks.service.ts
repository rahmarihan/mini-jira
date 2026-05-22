// backend/src/tasks/tasks.service.ts
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { DynamoService } from '../dynamo/dynamo.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { NotificationsService } from '../notifications/notifications.service';
import { FilesService } from '../files/files.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { CloudWatchMetricsService } from '../common/cloudwatch-metrics.service';
import { isManager, STATUS_ORDER, TaskStatus } from '../common/types';

@Injectable()
export class TasksService {
  private readonly tableName =
    process.env.DYNAMODB_TASKS_TABLE || 'mini-jira-tasks';

  constructor(
    private readonly dynamo: DynamoService,
    private readonly auditLog: AuditLogService,
    private readonly notifications: NotificationsService,
    private readonly metrics: CloudWatchMetricsService,

    @Inject(forwardRef(() => FilesService))
    private readonly filesService: FilesService,
  ) {}

  async create(dto: CreateTaskDto, user: CurrentUserPayload) {
    console.log('DEBUG create dto:', JSON.stringify(dto));

    if (!isManager(user)) {
      throw new ForbiddenException('Only managers can create tasks');
    }

    if (dto.teamId !== 'Frontend' && dto.teamId !== 'Backend') {
      throw new BadRequestException('teamId must be Frontend or Backend');
    }

    const task = {
      taskId: randomUUID(),
      ...dto,
      status: 'TODO' as TaskStatus,
      createdBy: user.sub,
      createdByName: user.name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await this.dynamo.putItem(this.tableName, task);

    if (task.assigneeId) {
      await this.notifications.publishTaskAssigned({
        taskId: task.taskId,
        title: task.title,
        teamId: task.teamId,
        assignedBy: user.name,
        assigneeName: task.assigneeName,
        assigneeId: task.assigneeId,
      });
    }

    void this.metrics.taskCreated(dto.teamId);

    return task;
  }

  async findAll(user: CurrentUserPayload, teamId?: string) {
    const all = await this.dynamo.scan(this.tableName);

    if (isManager(user)) {
      if (teamId) return all.filter((task) => task.teamId === teamId);
      return all;
    }

    if (user.teamId === 'ALL') {
      throw new ForbiddenException('Invalid employee team scope');
    }

    return all.filter((task) => task.teamId === user.teamId);
  }

  async findOne(taskId: string, user: CurrentUserPayload) {
    const task = await this.dynamo.getItem(this.tableName, { taskId });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    if (!isManager(user) && task.teamId !== user.teamId) {
      throw new ForbiddenException('You cannot access this task');
    }

    return task;
  }

  async update(taskId: string, dto: UpdateTaskDto, user: CurrentUserPayload) {
    await this.findOne(taskId, user);

    const updates = {
      ...dto,
      updatedAt: new Date().toISOString(),
    };

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
      {
        status: dto.status,
        updatedAt: new Date().toISOString(),
      },
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

    const task = await this.findOne(taskId, user);

    await this.filesService.deleteTaskImages(task.imageKey, task.thumbnailKey);
    await this.dynamo.deleteItem(this.tableName, { taskId });

    return {
      message: 'Task deleted successfully',
    };
  }

  async getAuditLog(taskId: string, user: CurrentUserPayload) {
    await this.findOne(taskId, user);
    return this.auditLog.getLogsForTask(taskId);
  }
}