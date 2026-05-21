import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { CognitoAuthGuard } from '../auth/cognito-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { TasksService } from '../tasks/tasks.service';
import { FilesService } from './files.service';

type CreateUploadUrlBody = {
  fileName: string;
  contentType: string;
};

@Controller('tasks/:taskId/files')
@UseGuards(CognitoAuthGuard)
export class FilesController {
  constructor(
    private readonly filesService: FilesService,
    private readonly tasksService: TasksService,
  ) {}

  @Post('upload-url')
  async createUploadUrl(
    @Param('taskId') taskId: string,
    @Body() body: CreateUploadUrlBody,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    await this.tasksService.findOne(taskId, user);
    return this.filesService.createTaskImageUploadUrl(taskId, body);
  }
}
