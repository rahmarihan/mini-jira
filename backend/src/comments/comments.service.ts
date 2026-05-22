import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { DynamoService } from '../dynamo/dynamo.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { TasksService } from '../tasks/tasks.service';
import type { CurrentUserPayload } from '../common/decorators/current-user.decorator';

@Injectable()
export class CommentsService {
  private tableName =
    process.env.DYNAMODB_COMMENTS_TABLE || 'Mini-jira-Comments';

  constructor(
    private readonly dynamoService: DynamoService,
    private readonly tasksService: TasksService,
  ) {}

  async create(
    taskId: string,
    dto: CreateCommentDto,
    user: CurrentUserPayload,
  ) {
    await this.tasksService.findOne(taskId, user);

    const comment = {
      commentId: randomUUID(),
      taskId,
      content: dto.content,
      userId: user.userId || user.sub,
      userEmail: user.email,
      userName: user.name || user.email,
      createdAt: new Date().toISOString(),
    };

    await this.dynamoService.putItem(this.tableName, comment);
    return comment;
  }

  async findByTask(taskId: string, user: CurrentUserPayload) {
    await this.tasksService.findOne(taskId, user);

    return this.dynamoService.queryByIndex(
      this.tableName,
      'taskId-index',
      'taskId',
      taskId,
    );
  }
}
