'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BarChart3, Download } from 'lucide-react';
import { useAuth } from '@/src/hooks/useAuth';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

type TeamReport = {
  teamId: string;
  total: number;
  completed: number;
  active: number;
};

type AssigneeReport = {
  assignee: string;
  total: number;
  completed: number;
  active: number;
};

type ReportData = {
  totalTasks: number;
  inProgress: number;
  inReview: number;
  completed: number;
  overdue: number;
  byTeam: TeamReport[];
  byAssignee: AssigneeReport[];
};

export default function ReportsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const isManager = user?.role === 'Manager';

  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && !isManager) {
      router.replace('/kanban');
    }
  }, [user, isManager, router]);

  useEffect(() => {
    if (!user || !isManager) return;

fetch('http://localhost:3001/notifications/reports/team-summary')      .then((res) => res.json())
      .then(setReport)
      .catch((err) => console.error('Failed to load reports:', err))
      .finally(() => setLoading(false));
  }, [user, isManager]);

  const exportCsv = () => {
    if (!report) return;

    const rows = [
      ['Metric', 'Value'],
      ['Total Tasks', report.totalTasks],
      ['In Progress', report.inProgress],
      ['In Review', report.inReview],
      ['Completed', report.completed],
      ['Overdue', report.overdue],
      [],
      ['Team', 'Total', 'Completed', 'Active'],
      ...report.byTeam.map((team) => [
        team.teamId,
        team.total,
        team.completed,
        team.active,
      ]),
      [],
      ['Assignee', 'Total', 'Completed', 'Active'],
      ...report.byAssignee.map((user) => [
        user.assignee,
        user.total,
        user.completed,
        user.active,
      ]),
    ];

    const csv = rows.map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = 'mini-jira-team-report.csv';
    link.click();

    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Team Reports
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Exportable metrics and sprint summaries
          </p>
        </div>

        <button
          onClick={exportCsv}
          disabled={!report}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
        >
          <Download className="size-4" />
          Export CSV
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading reports...</p>
      ) : !report ? (
        <p className="text-sm text-red-500">Failed to load reports.</p>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-5">
            <ReportCard title="Total Tasks" value={report.totalTasks} />
            <ReportCard title="In Progress" value={report.inProgress} />
            <ReportCard title="In Review" value={report.inReview} />
            <ReportCard title="Completed" value={report.completed} />
            <ReportCard title="Overdue" value={report.overdue} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="size-5 text-muted-foreground" />
                Team Breakdown
              </CardTitle>
              <CardDescription>
                Task progress grouped by team.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {report.byTeam.length === 0 ? (
                <p className="text-sm text-muted-foreground">No team data.</p>
              ) : (
                report.byTeam.map((team) => (
                  <div
                    key={team.teamId}
                    className="flex justify-between rounded-lg border p-3 text-sm"
                  >
                    <span className="font-medium">{team.teamId}</span>
                    <span>
                      {team.completed}/{team.total} done · {team.active} active
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Assignee Workload</CardTitle>
              <CardDescription>
                Task distribution grouped by employee.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {report.byAssignee.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No assignee data.
                </p>
              ) : (
                report.byAssignee.map((member) => (
                  <div
                    key={member.assignee}
                    className="flex justify-between rounded-lg border p-3 text-sm"
                  >
                    <span className="font-medium">{member.assignee}</span>
                    <span>
                      {member.completed}/{member.total} done · {member.active}{' '}
                      active
                    </span>
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