// backend/src/projects/projects.service.ts
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { DynamoService } from '../dynamo/dynamo.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { CurrentUserPayload } from '../common/decorators/current-user.decorator';

const TABLE = 'Projects';

@Injectable()
export class ProjectsService {
  constructor(private readonly dynamo: DynamoService) {}

  async create(dto: CreateProjectDto, user: CurrentUserPayload) {
    const project = {
      projectId: uuidv4(),
      ...dto,
      createdBy: user.sub,
      createdByName: user.name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await this.dynamo.putItem(TABLE, project);
    return project;
  }

  async findAll() {
    return this.dynamo.scan(TABLE);
  }

  async findOne(projectId: string) {
    const project = await this.dynamo.getItem(TABLE, { projectId });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  async update(projectId: string, dto: UpdateProjectDto, user: CurrentUserPayload) {
    if (user.role !== 'manager') throw new ForbiddenException('Only managers can update projects');
    await this.findOne(projectId);
    const updates = { ...dto, updatedAt: new Date().toISOString() };
    return this.dynamo.updateItem(TABLE, { projectId }, updates);
  }

  async remove(projectId: string, user: CurrentUserPayload) {
    if (user.role !== 'manager') throw new ForbiddenException('Only managers can delete projects');
    await this.findOne(projectId);
    await this.dynamo.deleteItem(TABLE, { projectId });
    return { message: 'Project deleted successfully' };
  }
}