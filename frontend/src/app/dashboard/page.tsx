import StatsCards from '@/src/components/dashboard/StatsCards';
import TeamDashboard from '@/src/components/dashboard/TeamDashboard';

/**
 * M5 — Dashboard UI shell only (stats + team overview).
 * No task board, no API calls. M2 wires stats, members, and loading here.
 * Kanban (/kanban) is M2’s task board — do not duplicate it on this page.
 */
export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-8 p-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Team statistics and member overview
        </p>
      </header>

      <StatsCards loading />
      <TeamDashboard loading />
    </div>
  );
}
