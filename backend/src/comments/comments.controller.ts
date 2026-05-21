import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CognitoAuthGuard } from '../auth/cognito-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../common/decorators/current-user.decorator';

@Controller('tasks/:taskId/comments')
@UseGuards(CognitoAuthGuard)
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  create(
    @Param('taskId') taskId: string,
    @Body() dto: CreateCommentDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.commentsService.create(taskId, dto, user);
  }

  @Get()
  findByTask(
    @Param('taskId') taskId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.commentsService.findByTask(taskId, user);
  }
}
