import { isOverdue } from '@/lib/utils';
import type { Task } from '@/src/types/task';
import type { DashboardMetrics } from '@/src/types/dashboard';

/** Derive manager dashboard metrics from the current task list (team-scoped by API). */
export function computeDashboardMetrics(tasks: Task[]): DashboardMetrics {
  return {
    totalTasks: tasks.length,
    inProgress: tasks.filter((t) => t.status === 'IN_PROGRESS').length,
    completed: tasks.filter((t) => t.status === 'DONE').length,
    overdue: tasks.filter((t) => t.status !== 'DONE' && isOverdue(t.deadline)).length,
    inReview: tasks.filter((t) => t.status === 'IN_REVIEW').length,
  };
}

/** Simple assignee breakdown for Team Performance (M4 may replace with analytics API). */
export function computeAssigneeStats(tasks: Task[]) {
  const map = new Map<string, { name: string; active: number; done: number }>();

  for (const task of tasks) {
    const key = task.assigneeId || 'unassigned';
    const existing = map.get(key) ?? {
      name: task.assigneeName || 'Unassigned',
      active: 0,
      done: 0,
    };

    if (task.status === 'DONE') {
      existing.done += 1;
    } else {
      existing.active += 1;
    }
    map.set(key, existing);
  }

  return Array.from(map.values()).sort((a, b) => b.active - a.active);
}
