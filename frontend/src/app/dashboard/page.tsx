'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/src/hooks/useAuth';
import { useAuthStore } from '@/src/store/auth.store';
import { useTasks } from '@/src/hooks/useTasks';
import { useTaskStore } from '@/src/store/task.store';
import { StatsCards } from '@/src/components/dashboard/StatsCards';
import { DashboardSkeletonLoader } from '@/src/components/dashboard/SkeletonLoader';
import CreateTaskForm from '@/src/components/tasks/CreateTaskForm';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { computeAssigneeStats, computeDashboardMetrics } from '@/src/lib/dashboard';
import { formatDate } from '@/lib/utils';
import type { TeamId } from '@/src/types/user';

function resolveTeamFilter(teamId?: TeamId): string | undefined {
  if (!teamId || teamId === 'ALL') return undefined;
  return teamId;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, fetchMe } = useAuth();
  const hydrateFromStorage = useAuthStore((state) => state.hydrateFromStorage);
  const idToken = useAuthStore((state) => state.idToken);
  const isManager = user?.role === 'Manager';
  const teamFilter = resolveTeamFilter(user?.teamId);

  const { tasks, loading, error, createTask } = useTasks(
    teamFilter,
    Boolean(idToken) && isManager,
  );
  const { isCreateFormOpen, openCreateForm, closeCreateForm } = useTaskStore();

  useEffect(() => {
    hydrateFromStorage();
    void fetchMe();
  }, [fetchMe, hydrateFromStorage]);

  useEffect(() => {
    if (!isAuthenticated && !localStorage.getItem('mini-jira.idToken')) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (user && !isManager) {
      router.replace('/kanban');
    }
  }, [user, isManager, router]);

  useEffect(() => {
    if (error) {
      toast.error('Failed to load dashboard', { description: error });
    }
  }, [error]);

  const metrics = useMemo(() => computeDashboardMetrics(tasks), [tasks]);
  const assigneeStats = useMemo(() => computeAssigneeStats(tasks), [tasks]);
  const recentTasks = useMemo(
    () =>
      [...tasks]
        .sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
        )
        .slice(0, 6),
    [tasks],
  );

  if (!user || !isManager) {
    return <DashboardSkeletonLoader />;
  }

  if (loading) {
    return <DashboardSkeletonLoader />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Team Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Overview for {user.teamId === 'ALL' ? 'all teams' : `${user.teamId} team`}
          </p>
        </div>
        <Button onClick={openCreateForm} className="w-fit shrink-0">
          <Plus className="size-4" />
          New Task
        </Button>
      </div>

      <StatsCards metrics={metrics} />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* M4: replace with audit-log / activity feed API */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest task updates across your team</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent activity yet.</p>
            ) : (
              recentTasks.map((task) => (
                <div
                  key={task.taskId}
                  className="flex items-start justify-between gap-3 rounded-lg border border-border/60 bg-muted/30 px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{task.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {task.assigneeName} · updated {formatDate(task.updatedAt)}
                    </p>
                  </div>
                  <Badge variant="outline" className="shrink-0 text-[10px]">
                    {task.status.replace('_', ' ')}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* M4: replace with analytics / reporting service */}
        <Card>
          <CardHeader>
            <CardTitle>Team Performance</CardTitle>
            <CardDescription>Workload by assignee (client-side summary)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {assigneeStats.length === 0 ? (
              <p className="text-sm text-muted-foreground">No assignee data available.</p>
            ) : (
              assigneeStats.map((member) => {
                const total = member.active + member.done;
                const completionRate = total ? Math.round((member.done / total) * 100) : 0;

                return (
                  <div key={member.name} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{member.name}</span>
                      <span className="text-muted-foreground tabular-nums">
                        {member.done}/{total} done
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${completionRate}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {member.active} active · {completionRate}% completion
                    </p>
                    <Separator />
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      {isCreateFormOpen && (
        <CreateTaskForm
          onSubmit={createTask}
          onCancel={closeCreateForm}
          isManager={isManager}
        />
      )}
    </div>
  );
}
