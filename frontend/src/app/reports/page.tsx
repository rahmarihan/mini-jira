'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { BarChart3 } from 'lucide-react';
import { useAuth } from '@/src/hooks/useAuth';
import { useAuthStore } from '@/src/store/auth.store';
import { useTasks } from '@/src/hooks/useTasks';
import { computeAssigneeStats, computeDashboardMetrics } from '@/src/lib/dashboard';
import { StatsCards } from '@/src/components/dashboard/StatsCards';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function ReportsPage() {
  const router = useRouter();
  const { user, fetchMe } = useAuth();
  const hydrateFromStorage = useAuthStore((state) => state.hydrateFromStorage);
  const idToken = useAuthStore((state) => state.idToken);
  const isManager = user?.role === 'Manager';
  const { tasks, loading, error } = useTasks(
    undefined,
    Boolean(idToken) && Boolean(user?.role && user?.teamId) && isManager,
  );

  useEffect(() => {
    hydrateFromStorage();
    void fetchMe();
  }, [fetchMe, hydrateFromStorage]);

  useEffect(() => {
    if (user && !isManager) {
      router.replace('/kanban');
    }
  }, [user, isManager, router]);

  const metrics = useMemo(() => computeDashboardMetrics(tasks), [tasks]);
  const assigneeStats = useMemo(() => computeAssigneeStats(tasks), [tasks]);

  if (!user || !isManager) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Team Reports</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Live task metrics from the current workspace data
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading reports...</p>
      ) : error ? (
        <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      ) : (
        <>
          <StatsCards metrics={metrics} />

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="size-5" />
                Assignee Workload
              </CardTitle>
              <CardDescription>
                Active and completed tasks grouped by assigned user.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {assigneeStats.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No task data is available yet.
                </p>
              ) : (
                assigneeStats.map((member) => (
                  <div
                    key={member.assigneeId}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/60 px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-medium">{member.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {member.assigneeId}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="secondary">{member.active} active</Badge>
                      <Badge variant="outline">{member.done} done</Badge>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
