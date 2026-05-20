/**
 * M5 — Presentational stats cards. No fetching, stores, or services.
 * M2 passes `stats` and toggles `loading` from the dashboard page.
 */
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  ListTodo,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DashboardStats {
  total: number;
  completed: number;
  inProgress: number;
  overdue: number;
}

export interface StatsCardsProps {
  stats?: DashboardStats;
  loading?: boolean;
}

interface StatConfig {
  key: keyof DashboardStats;
  title: string;
  icon: LucideIcon;
  iconClass: string;
}

const STAT_CONFIG: StatConfig[] = [
  { key: 'total', title: 'Total Tasks', icon: ListTodo, iconClass: 'bg-blue-100 text-blue-700' },
  { key: 'completed', title: 'Completed', icon: CheckCircle2, iconClass: 'bg-green-100 text-green-700' },
  { key: 'inProgress', title: 'In Progress', icon: Clock, iconClass: 'bg-amber-100 text-amber-700' },
  { key: 'overdue', title: 'Overdue', icon: AlertTriangle, iconClass: 'bg-red-100 text-red-700' },
];

function StatCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="skeleton-shimmer h-4 w-24 rounded-md" />
        <div className="skeleton-shimmer size-9 rounded-lg" />
      </CardHeader>
      <CardContent>
        <div className="skeleton-shimmer h-8 w-16 rounded-md" />
        <div className="skeleton-shimmer mt-2 h-3 w-32 rounded-md" />
      </CardContent>
    </Card>
  );
}

function trendLabel(value: number, total: number): string | null {
  if (total === 0) return null;
  return `${Math.round((value / total) * 100)}% of total`;
}

function StatsCards({ stats, loading = false }: StatsCardsProps) {
  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STAT_CONFIG.map(({ key }) => (
          <StatCardSkeleton key={key} />
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="rounded-lg border border-dashed bg-muted/30 px-6 py-10 text-center text-sm text-muted-foreground">
        Task statistics will appear here once M2 connects the data layer.
      </div>
    );
  }

  const data = stats;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {STAT_CONFIG.map(({ key, title, icon: Icon, iconClass }) => {
        const count = data[key];
        const trend = key !== 'total' ? trendLabel(count, data.total) : null;

        return (
          <Card key={key}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {title}
              </CardTitle>
              <div
                className={cn(
                  'flex size-9 items-center justify-center rounded-lg',
                  iconClass,
                )}
              >
                <Icon className="size-4" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold tracking-tight">{count}</p>
              {trend && (
                <p className="mt-1 text-xs text-muted-foreground">{trend}</p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export default StatsCards;
export { StatsCards };
