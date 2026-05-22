import { Injectable } from '@nestjs/common';
import { DynamoService } from '../dynamo/dynamo.service';

@Injectable()
export class ReportsService {
  private readonly tasksTable =
    process.env.DYNAMODB_TASKS_TABLE || 'mini-jira-tasks';

  constructor(private readonly dynamo: DynamoService) {}

  async getTeamSummary() {
    const tasks = await this.dynamo.scan(this.tasksTable);

    const totalTasks = tasks.length;
    const inProgress = tasks.filter((t) => t.status === 'IN_PROGRESS').length;
    const inReview = tasks.filter((t) => t.status === 'IN_REVIEW').length;
    const completed = tasks.filter((t) => t.status === 'DONE').length;

    const today = new Date();
    const overdue = tasks.filter((task) => {
      if (!task.deadline || task.status === 'DONE') return false;
      return new Date(task.deadline) < today;
    }).length;

    const byTeam = tasks.reduce((acc, task) => {
      const team = task.teamId || 'Unknown';

      if (!acc[team]) {
        acc[team] = {
          teamId: team,
          total: 0,
          completed: 0,
          active: 0,
        };
      }

      acc[team].total += 1;

      if (task.status === 'DONE') {
        acc[team].completed += 1;
      } else {
        acc[team].active += 1;
      }

      return acc;
    }, {});

    const byAssignee = tasks.reduce((acc, task) => {
      const assignee = task.assigneeName || task.assigneeId || 'Unassigned';

      if (!acc[assignee]) {
        acc[assignee] = {
          assignee,
          total: 0,
          completed: 0,
          active: 0,
        };
      }

      acc[assignee].total += 1;

      if (task.status === 'DONE') {
        acc[assignee].completed += 1;
      } else {
        acc[assignee].active += 1;
      }

      return acc;
    }, {});

    return {
      totalTasks,
      inProgress,
      inReview,
      completed,
      overdue,
      byTeam: Object.values(byTeam),
      byAssignee: Object.values(byAssignee),
    };
  }
}