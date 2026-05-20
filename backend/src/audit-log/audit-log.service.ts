import { Injectable } from '@nestjs/common';
import { DynamoService } from '../dynamo/dynamo.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuditLogService {
  private readonly tableName =
    process.env.DYNAMODB_AUDIT_LOG_TABLE || 'Mini-jira-AuditLog';

  constructor(private readonly dynamoService: DynamoService) {}

  async logStatusChange(params: {
    taskId: string;
    changedBy: string;      // userId from JWT
    changedByName: string;  // display name
    oldStatus: string;
    newStatus: string;
  }) {
    const item = {
      logId: uuidv4(),
      taskId: params.taskId,
      changedBy: params.changedBy,
      changedByName: params.changedByName,
      oldStatus: params.oldStatus,
      newStatus: params.newStatus,
      timestamp: new Date().toISOString(),
    };

    await this.dynamoService.putItem(this.tableName, item);
    return item;
  }

  async getLogsForTask(taskId: string) {
    return this.dynamoService.queryByIndex(
      this.tableName,
      'taskId-index',
      'taskId',
      taskId,
    );
  }
}
