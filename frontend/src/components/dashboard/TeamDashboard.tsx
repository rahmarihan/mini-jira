/**
 * M5 — Presentational team member list. No fetching, stores, or services.
 * M2 passes `members`, `teamId`, and toggles `loading` from the dashboard page.
 */
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card';
import { Users } from 'lucide-react';

export interface TeamMember {
  name: string;
  role: string;
  taskCount: number;
}

export interface TeamDashboardProps {
  teamId?: string;
  /** M2 supplies member rows from API */
  members?: TeamMember[];
  loading?: boolean;
}

function MemberAvatar({ name }: { name: string }) {
  const initials = name
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary"
      aria-hidden
    >
      {initials}
    </div>
  );
}

function MemberRowSkeleton() {
  return (
    <div className="flex items-center gap-4 rounded-lg border p-4">
      <div className="skeleton-shimmer size-10 shrink-0 rounded-full" />
      <div className="flex-1 space-y-2">
        <div className="skeleton-shimmer h-4 w-36 rounded-md" />
        <div className="skeleton-shimmer h-3 w-20 rounded-md" />
      </div>
      <div className="skeleton-shimmer h-6 w-12 rounded-md" />
    </div>
  );
}

function TeamDashboard({
  teamId = '—',
  members = [],
  loading = false,
}: TeamDashboardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Users className="size-5 text-muted-foreground" />
          <div>
            <CardTitle>Team Overview</CardTitle>
            <CardDescription>
              Members and task assignments for team {teamId}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <MemberRowSkeleton key={i} />
            ))}
          </div>
        ) : members.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Team member assignments will appear here once M2 connects the data
            layer.
          </p>
        ) : (
          <ul className="space-y-3">
            {members.map((member, index) => (
              <li
                key={`${member.name}-${index}`}
                className="flex items-center gap-4 rounded-lg border bg-card p-4 transition-colors hover:bg-muted/40"
              >
                <MemberAvatar name={member.name} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{member.name}</p>
                  <p className="text-sm capitalize text-muted-foreground">
                    {member.role}
                  </p>
                </div>
                <div className="text-right text-sm">
                  <p className="font-semibold">{member.taskCount}</p>
                  <p className="text-muted-foreground">Tasks</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export default TeamDashboard;
export { TeamDashboard };
