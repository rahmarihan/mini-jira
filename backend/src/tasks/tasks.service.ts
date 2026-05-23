// backend/src/tasks/tasks.service.ts
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { randomUUID } from 'crypto';

import { AuditLogService } from '../audit-log/audit-log.service';
import { CloudWatchMetricsService } from '../common/cloudwatch-metrics.service';
import { CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { isManager, STATUS_ORDER, TaskStatus } from '../common/types';
import { DynamoService } from '../dynamo/dynamo.service';
import { FilesService } from '../files/files.service';

import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
  private readonly tableName =
    process.env.DYNAMODB_TASKS_TABLE || 'Mini-jira-Tasks';

  private readonly snsClient = new SNSClient({
    region: process.env.AWS_REGION || 'eu-north-1',
  });

  private readonly taskAssignmentTopicArn =
    process.env.TASK_ASSIGNMENT_TOPIC_ARN ||
    'arn:aws:sns:eu-north-1:507210367772:task-assignment-topic';

  constructor(
    private readonly dynamo: DynamoService,
    private readonly auditLog: AuditLogService,
    private readonly metrics: CloudWatchMetricsService,
    @Inject(forwardRef(() => FilesService))
    private readonly filesService: FilesService,
  ) {}

  private async publishTaskAssigned(
    task: Record<string, any>,
    assignedBy: string,
  ) {
    if (!this.taskAssignmentTopicArn) return;

    try {
      await this.snsClient.send(
        new PublishCommand({
          TopicArn: this.taskAssignmentTopicArn,
          Message: JSON.stringify({
            eventType: 'TASK_ASSIGNED',
            taskId: task.taskId,
            title: task.title,
            teamId: task.teamId,
            assignedBy,
            assignee: task.assigneeName,
          }),
        }),
      );
    } catch (err) {
      console.error('SNS publish failed:', err);
    }
  }

  async create(dto: CreateTaskDto, user: CurrentUserPayload) {
    if (!isManager(user)) {
      throw new ForbiddenException('Only managers can create tasks');
    }

    if (!dto.teamId?.trim()) {
      throw new BadRequestException('teamId is required');
    }

    const task = {
      taskId: randomUUID(),
      ...dto,
      status: 'TODO' as TaskStatus,
      createdBy: user.sub,
      createdByName: user.name || user.email,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await this.dynamo.putItem(this.tableName, task);

    void this.metrics.taskCreated(dto.teamId);
    await this.publishTaskAssigned(task, user.name || user.email);
    return this.withImageViewUrls(task);
  }

  async findAll(user: CurrentUserPayload, teamId?: string) {
    const all = await this.dynamo.scan(this.tableName);
    let tasks: Record<string, any>[];
    
    if (isManager(user)) {
      tasks = teamId ? all.filter((task) => task.teamId === teamId) : all;
    } else {
      if (!user.teamId || user.teamId === 'ALL') {
        throw new ForbiddenException(
          'Your account is pending Manager team assignment',
        );
      }

      // Employees: server-side team isolation — ignore teamId query param.
      tasks = all.filter((task) => task.teamId === user.teamId);
    }

    return Promise.all(tasks.map((task) => this.withImageViewUrls(task)));
  }

  async findOne(taskId: string, user: CurrentUserPayload) {
    const task = await this.dynamo.getItem(this.tableName, { taskId });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    if (!isManager(user) && (!user.teamId || task.teamId !== user.teamId)) {
      throw new ForbiddenException('You cannot access this task');
    }
    return this.withImageViewUrls(task);
  }

  async update(taskId: string, dto: UpdateTaskDto, user: CurrentUserPayload) {
    await this.findOne(taskId, user);

    if (
      !isManager(user) &&
      (dto.assigneeId !== undefined || dto.assigneeName !== undefined)
    ) {
      throw new ForbiddenException('Only managers can assign tasks');
    }

    const normalizedUpdates: Record<string, any> = { ...dto };
    const assigneeId =
      typeof normalizedUpdates.assigneeId === 'string'
        ? normalizedUpdates.assigneeId.trim()
        : normalizedUpdates.assigneeId;
    const assigneeName =
      typeof normalizedUpdates.assigneeName === 'string'
        ? normalizedUpdates.assigneeName.trim()
        : normalizedUpdates.assigneeName;

    if (assigneeId === '' || assigneeName === '') {
      normalizedUpdates.assigneeId = null;
      normalizedUpdates.assigneeName = null;
    }

    const updates = {
      ...normalizedUpdates,
      updatedAt: new Date().toISOString(),
    };

    const updated = await this.dynamo.updateItem(
      this.tableName,
      { taskId },
      updates,
    );
    return this.withImageViewUrls(updated);
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
      changedByName: user.name || user.email,
      oldStatus: String(task.status),
      newStatus: dto.status,
    });

    if (dto.status === 'DONE') {
      const created = new Date(String(task.createdAt)).getTime();
      const seconds = Math.round((Date.now() - created) / 1000);
      void this.metrics.taskClosed(String(task.teamId), seconds);
    }

    return this.withImageViewUrls(updated);
  }

  async remove(taskId: string, user: CurrentUserPayload) {
    if (!isManager(user)) {
      throw new ForbiddenException('Only managers can delete tasks');
    }

    const task = await this.findOne(taskId, user);

    await this.filesService.deleteTaskImages(task.imageKey, task.thumbnailKey);
    await this.dynamo.deleteItem(this.tableName, { taskId });

    return { message: 'Task deleted successfully' };
  }

  async getAuditLog(taskId: string, user: CurrentUserPayload) {
    await this.findOne(taskId, user);
    return this.auditLog.getLogsForTask(taskId);
  }

  private async withImageViewUrls(
    task: Record<string, any>,
  ): Promise<Record<string, any>> {
    try {
      const [thumbnailViewUrl, imageViewUrl] = await Promise.all([
        this.filesService.createThumbnailViewUrl(task.thumbnailKey),
        this.filesService.createImageViewUrl(task.imageKey),
      ]);

      return {
        ...task,
        ...(thumbnailViewUrl ? { thumbnailViewUrl } : {}),
        ...(imageViewUrl ? { imageViewUrl } : {}),
      };
    } catch (err) {
      console.error('Failed to generate image view URLs:', err);
      return task;
    }
  }
}
