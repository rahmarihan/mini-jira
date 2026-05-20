import { Task } from '../types/task';
import { isOverdue } from '@/lib/utils';

export interface DashboardStats {
  total: number;
  completed: number;
  inProgress: number;
  overdue: number;
}

export interface TeamMemberSummary {
  userId: string;
  name: string;
  role: string;
  taskCount: number;
  completedCount: number;
  inProgressCount: number;
}

export function computeDashboardStats(tasks: Task[]): DashboardStats {
  return {
    total: tasks.length,
    completed: tasks.filter((t) => t.status === 'DONE').length,
    inProgress: tasks.filter(
      (t) => t.status === 'IN_PROGRESS' || t.status === 'IN_REVIEW',
    ).length,
    overdue: tasks.filter(
      (t) => t.status !== 'DONE' && isOverdue(t.deadline),
    ).length,
  };
}

export function buildTeamMembers(tasks: Task[], teamId: string): TeamMemberSummary[] {
  const teamTasks = teamId ? tasks.filter((t) => t.teamId === teamId) : tasks;
  const byAssignee = new Map<string, TeamMemberSummary>();

  for (const task of teamTasks) {
    const existing = byAssignee.get(task.assigneeId) ?? {
      userId: task.assigneeId,
      name: task.assigneeName,
      role: 'Member',
      taskCount: 0,
      completedCount: 0,
      inProgressCount: 0,
    };
    existing.taskCount += 1;
    if (task.status === 'DONE') existing.completedCount += 1;
    if (task.status === 'IN_PROGRESS' || task.status === 'IN_REVIEW') {
      existing.inProgressCount += 1;
    }
    byAssignee.set(task.assigneeId, existing);
  }

  return Array.from(byAssignee.values()).sort((a, b) => b.taskCount - a.taskCount);
}

export function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}
