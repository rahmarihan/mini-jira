import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

export type AssignedTaskEvent = {
  taskId: string;
  title: string;
  teamId: string;
  assignedBy: string;
  assigneeName: string;
  assigneeId?: string;
};

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly snsClient: SNSClient;
  private readonly snsTopicArn: string | undefined;

  constructor(private readonly configService: ConfigService) {
    const awsRegion =
      this.configService.get<string>('AWS_REGION') || 'eu-north-1';

    this.snsTopicArn = this.configService.get<string>(
      'TASK_ASSIGNMENT_TOPIC_ARN',
    );

    this.snsClient = new SNSClient({ region: awsRegion });
  }

  async publishTaskAssigned(task: AssignedTaskEvent): Promise<void> {
    if (!this.snsTopicArn) {
      this.logger.warn('TASK_ASSIGNMENT_TOPIC_ARN is not set');
      return;
    }

    const message = {
      eventType: 'TASK_ASSIGNED',
      taskId: task.taskId,
      title: task.title,
      teamId: task.teamId,
      assignedBy: task.assignedBy,
      assignee: task.assigneeName || task.assigneeId,
      assigneeName: task.assigneeName,
      assigneeId: task.assigneeId,
      assignedAt: new Date().toISOString(),
    };

    await this.snsClient.send(
      new PublishCommand({
        TopicArn: this.snsTopicArn,
        Subject: `Task Assigned: ${task.title}`,
        Message: JSON.stringify(message),
      }),
    );

    this.logger.log(`SNS published task assignment for task ${task.taskId}`);
  }
}