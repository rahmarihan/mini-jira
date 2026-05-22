import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';

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
  private readonly sqsClient: SQSClient;
  private readonly awsRegion: string;
  private readonly snsTopicArn: string | undefined;
  private readonly sqsQueueUrl: string | undefined;

  constructor(private readonly configService: ConfigService) {
    this.awsRegion = this.configService.get<string>('AWS_REGION') || 'eu-north-1';
    this.snsTopicArn = this.configService.get<string>('TASK_ASSIGNMENT_TOPIC_ARN');
    this.sqsQueueUrl = this.configService.get<string>('TASK_ASSIGNMENT_QUEUE_URL');

    this.snsClient = new SNSClient({ region: this.awsRegion });
    this.sqsClient = new SQSClient({ region: this.awsRegion });
  }

  async publishTaskAssigned(task: AssignedTaskEvent): Promise<void> {
    if (!this.snsTopicArn) {
      this.logger.warn('TASK_ASSIGNMENT_TOPIC_ARN is not set, skipping SNS publish');
      return;
    }

    const message = {
      eventType: 'TASK_ASSIGNED',
      taskId: task.taskId,
      title: task.title,
      teamId: task.teamId,
      assignedBy: task.assignedBy,
      assigneeName: task.assigneeName,
      assigneeId: task.assigneeId,
      assignedAt: new Date().toISOString(),
    };

    try {
      // Publish to SNS topic (fan-out to email, SQS, etc.)
      await this.snsClient.send(
        new PublishCommand({
          TopicArn: this.snsTopicArn,
          Subject: `Task Assigned: ${task.title}`,
          Message: JSON.stringify(message),
        }),
      );
      this.logger.log(`SNS published task assignment for task ${task.taskId}`);
    } catch (err) {
      this.logger.error(`SNS publish failed: ${err}`, err);
    }

    // Also publish to SQS if configured (worker Lambda will consume from queue)
    if (this.sqsQueueUrl) {
      try {
        await this.sqsClient.send(
          new SendMessageCommand({
            QueueUrl: this.sqsQueueUrl,
            MessageBody: JSON.stringify(message),
            MessageAttributes: {
              EventType: {
                StringValue: 'TASK_ASSIGNED',
                DataType: 'String',
              },
            },
          }),
        );
        this.logger.log(`SQS queued task assignment for task ${task.taskId}`);
      } catch (err) {
        this.logger.error(`SQS send failed: ${err}`, err);
      }
    }
  }
}