// backend/src/tasks/tasks.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';

import { TasksService } from './tasks.service';

import type { CreateTaskDto } from './dto/create-task.dto';
import type { UpdateTaskDto } from './dto/update-task.dto';
import type { UpdateTaskStatusDto } from './dto/update-task-status.dto';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../common/decorators/current-user.decorator';

import { Roles } from '../common/guards/roles.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CognitoAuthGuard } from '../auth/cognito-auth.guard';

@Controller('tasks')
@UseGuards(CognitoAuthGuard, RolesGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @Roles('Manager')
  create(@Body() dto: CreateTaskDto, @CurrentUser() user: CurrentUserPayload) {
    return this.tasksService.create(dto, user);
  }

  @Get()
  findAll(
    @CurrentUser() user: CurrentUserPayload,
    @Query('teamId') teamId?: string,
  ) {
    return this.tasksService.findAll(user, teamId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.tasksService.findOne(id, user);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.tasksService.update(id, dto, user);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateTaskStatusDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.tasksService.updateStatus(id, dto, user);
  }

  @Delete(':id')
  @Roles('Manager')
  remove(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.tasksService.remove(id, user);
  }

  @Get(':id/audit-log')
  getAuditLog(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.tasksService.getAuditLog(id, user);
  }
}
