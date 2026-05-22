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
      createdByName: user.name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await this.dynamo.putItem(this.tableName, project);
    return project;
  }

  async findAll() {
    return this.dynamo.scan(this.tableName);
  }

  async findOne(projectId: string) {
    const project = await this.dynamo.getItem(this.tableName, { projectId });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  async update(
    projectId: string,
    dto: UpdateProjectDto,
    user: CurrentUserPayload,
  ) {
    if (!isManager(user))
      throw new ForbiddenException('Only managers can update projects');
    await this.findOne(projectId);
    const updates = { ...dto, updatedAt: new Date().toISOString() };
    return this.dynamo.updateItem(this.tableName, { projectId }, updates);
  }

  async remove(projectId: string, user: CurrentUserPayload) {
    if (!isManager(user))
      throw new ForbiddenException('Only managers can delete projects');
    await this.findOne(projectId);
    await this.dynamo.deleteItem(this.tableName, { projectId });
    return { message: 'Project deleted successfully' };
  }
}
