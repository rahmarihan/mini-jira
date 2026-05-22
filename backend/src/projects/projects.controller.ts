// backend/src/projects/projects.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { Roles, RolesGuard } from '../common/guards/roles.guard';
import { CognitoAuthGuard } from '../auth/cognito-auth.guard';

@Controller('projects')
@UseGuards(CognitoAuthGuard, RolesGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @Roles('Manager')
  create(
    @Body() dto: CreateProjectDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.projectsService.create(dto, user);
  }

  @Get()
  findAll(@CurrentUser() user: CurrentUserPayload) {
    return this.projectsService.findAll(user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.projectsService.findOne(id, user);
  }

  @Patch(':id')
  @Roles('Manager')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.projectsService.update(id, dto, user);
  }

  @Delete(':id')
  @Roles('Manager')
  remove(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.projectsService.remove(id, user);
  }
}
