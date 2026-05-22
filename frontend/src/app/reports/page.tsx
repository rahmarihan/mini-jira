"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { BarChart3, Download } from "lucide-react";

import { useAuth } from "@/src/hooks/useAuth";
import { useAuthStore } from "@/src/store/auth.store";
import { useTasks } from "@/src/hooks/useTasks";
import {
  computeAssigneeStats,
  computeDashboardMetrics,
} from "@/src/lib/dashboard";
import { StatsCards } from "@/src/components/dashboard/StatsCards";
import { isOverdue } from "@/lib/utils";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type TeamReport = {
  teamId: string;
  total: number;
  completed: number;
  active: number;
};

function csvEscape(value: string | number) {
  const text = String(value);
  if (text.includes(",") || text.includes('"') || text.includes("\n")) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export default function ReportsPage() {
  const router = useRouter();

  const { user, fetchMe } = useAuth();
  const hydrateFromStorage = useAuthStore((state) => state.hydrateFromStorage);
  const idToken = useAuthStore((state) => state.idToken);

  const isManager = user?.role === "Manager";

  const { tasks, loading, error } = useTasks(
    undefined,
    Boolean(idToken) && Boolean(user?.role && user?.teamId) && isManager,
  );

  useEffect(() => {
    hydrateFromStorage();
    void fetchMe();
  }, [fetchMe, hydrateFromStorage]);

  useEffect(() => {
    if (!idToken && !localStorage.getItem("mini-jira.idToken")) {
      router.replace("/auth/login");
    }
  }, [idToken, router]);

  useEffect(() => {
    if (user && !isManager) {
      router.replace("/kanban");
    }
  }, [user, isManager, router]);

  const metrics = useMemo(() => computeDashboardMetrics(tasks), [tasks]);

  const assigneeStats = useMemo(() => computeAssigneeStats(tasks), [tasks]);

  const teamReports = useMemo<TeamReport[]>(() => {
    const grouped = new Map<string, TeamReport>();

    tasks.forEach((task) => {
      const teamId = task.teamId || "Unassigned";

      const existing = grouped.get(teamId) ?? {
        teamId,
        total: 0,
        completed: 0,
        active: 0,
      };

      existing.total += 1;

      if (task.status === "DONE") {
        existing.completed += 1;
      } else {
        existing.active += 1;
      }

      grouped.set(teamId, existing);
    });

    return [...grouped.values()].sort((a, b) =>
      a.teamId.localeCompare(b.teamId),
    );
  }, [tasks]);

  const statusSummary = useMemo(() => {
    return {
      totalTasks: tasks.length,
      inProgress: tasks.filter((task) => task.status === "IN_PROGRESS").length,
      inReview: tasks.filter((task) => task.status === "IN_REVIEW").length,
      completed: tasks.filter((task) => task.status === "DONE").length,
      overdue: tasks.filter(
        (task) => task.status !== "DONE" && isOverdue(task.deadline),
      ).length,
    };
  }, [tasks]);

  const exportCsv = () => {
    const rows: Array<Array<string | number>> = [
      ["Metric", "Value"],
      ["Total Tasks", statusSummary.totalTasks],
      ["In Progress", statusSummary.inProgress],
      ["In Review", statusSummary.inReview],
      ["Completed", statusSummary.completed],
      ["Overdue", statusSummary.overdue],
      [],
      ["Team", "Total", "Completed", "Active"],
      ...teamReports.map((team) => [
        team.teamId,
        team.total,
        team.completed,
        team.active,
      ]),
      [],
      ["Assignee", "ID", "Completed", "Active"],
      ...assigneeStats.map((member) => [
        member.name,
        member.assigneeId,
        member.done,
        member.active,
      ]),
    ];

    const csv = rows
      .map((row) => row.map((cell) => csvEscape(cell)).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "mini-jira-team-report.csv";
    link.click();

    URL.revokeObjectURL(url);
  };

  if (!user || !isManager) {
    return null;
  }

  if (!user.role || !user.teamId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your account is pending Manager assignment.</CardTitle>
          <CardDescription>
            A Manager needs to assign your role and team before report data is
            available.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Team Reports
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Live task metrics from the current workspace data.
          </p>
        </div>

        <button
          onClick={exportCsv}
          disabled={loading || tasks.length === 0}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
        >
          <Download className="size-4" />
          Export CSV
        </button>
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

          <div className="grid gap-4 md:grid-cols-5">
            <ReportCard title="Total Tasks" value={statusSummary.totalTasks} />
            <ReportCard title="In Progress" value={statusSummary.inProgress} />
            <ReportCard title="In Review" value={statusSummary.inReview} />
            <ReportCard title="Completed" value={statusSummary.completed} />
            <ReportCard title="Overdue" value={statusSummary.overdue} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="size-5" />
                Team Breakdown
              </CardTitle>

              <CardDescription>Task progress grouped by team.</CardDescription>
            </CardHeader>

            <CardContent className="space-y-3">
              {teamReports.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No team data is available yet.
                </p>
              ) : (
                teamReports.map((team) => (
                  <div
                    key={team.teamId}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/60 px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-medium">{team.teamId}</p>
                      <p className="text-xs text-muted-foreground">
                        {team.total} total tasks
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Badge variant="secondary">{team.active} active</Badge>
                      <Badge variant="outline">{team.completed} done</Badge>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

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
                  No assignee data is available yet.
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

function ReportCard({ title, value }: { title: string; value: number }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-2xl">{value}</CardTitle>
      </CardHeader>
    </Card>
  );
}
