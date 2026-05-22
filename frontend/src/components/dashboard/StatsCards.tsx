import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Eye,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { DashboardMetrics } from '@/src/types/dashboard';

interface StatsCardsProps {
  metrics: DashboardMetrics;
}

const STAT_CONFIG = [
  {
    key: 'totalTasks' as const,
    label: 'Total Tasks',
    description: 'All tasks in scope',
    icon: ClipboardList,
    accent: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40',
  },
  {
    key: 'inProgress' as const,
    label: 'In Progress',
    description: 'Actively being worked',
    icon: Loader2,
    accent: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40',
  },
  {
    key: 'inReview' as const,
    label: 'In Review',
    description: 'Awaiting approval',
    icon: Eye,
    accent: 'text-violet-600 bg-violet-50 dark:bg-violet-950/40',
  },
  {
    key: 'completed' as const,
    label: 'Completed',
    description: 'Marked as done',
    icon: CheckCircle2,
    accent: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40',
  },
  {
    key: 'overdue' as const,
    label: 'Overdue',
    description: 'Past deadline, not done',
    icon: AlertTriangle,
    accent: 'text-red-600 bg-red-50 dark:bg-red-950/40',
  },
];

export function StatsCards({ metrics }: StatsCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {STAT_CONFIG.map((stat) => {
        const Icon = stat.icon;
        const value = metrics[stat.key];

        return (
          <Card
            key={stat.key}
            size="sm"
            className="transition-shadow hover:shadow-md"
          >
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
              <span
                className={cn(
                  'flex size-8 items-center justify-center rounded-lg',
                  stat.accent,
                )}
              >
                <Icon className="size-4" />
              </span>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold tracking-tight tabular-nums">
                {value}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
