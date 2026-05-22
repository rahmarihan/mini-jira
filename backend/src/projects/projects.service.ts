// backend/src/projects/projects.service.ts
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { DynamoService } from '../dynamo/dynamo.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { isManager } from '../common/types';

@Injectable()
export class ProjectsService {
  private readonly tableName =
    process.env.DYNAMODB_PROJECTS_TABLE || 'Mini-jira-Projects';

  constructor(private readonly dynamo: DynamoService) {}

  async create(dto: CreateProjectDto, user: CurrentUserPayload) {
    const project = {
      projectId: randomUUID(),
      ...dto,
      createdBy: user.sub,
      createdByName: user.name || user.email,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await this.dynamo.putItem(this.tableName, project);
    return project;
  }

  async findAll(user: CurrentUserPayload) {
    const projects = await this.dynamo.scan(this.tableName);
    if (isManager(user)) return projects;
    if (!user.teamId) {
      throw new ForbiddenException(
        'Your account is pending Manager team assignment',
      );
    }
    return projects.filter(
      (project) => !project.teamId || project.teamId === user.teamId,
    );
  }

  async findOne(projectId: string, user?: CurrentUserPayload) {
    const project = await this.dynamo.getItem(this.tableName, { projectId });
    if (!project) throw new NotFoundException('Project not found');
    if (
      user &&
      !isManager(user) &&
      project.teamId &&
      project.teamId !== user.teamId
    ) {
      throw new ForbiddenException('You cannot access this project');
    }
    return project;
  }

  async update(
    projectId: string,
    dto: UpdateProjectDto,
    user: CurrentUserPayload,
  ) {
    if (!isManager(user))
      throw new ForbiddenException('Only managers can update projects');
    await this.findOne(projectId, user);
    const updates = { ...dto, updatedAt: new Date().toISOString() };
    return this.dynamo.updateItem(this.tableName, { projectId }, updates);
  }

  async remove(projectId: string, user: CurrentUserPayload) {
    if (!isManager(user))
      throw new ForbiddenException('Only managers can delete projects');
    await this.findOne(projectId, user);
    await this.dynamo.deleteItem(this.tableName, { projectId });
    return { message: 'Project deleted successfully' };
  }
}
