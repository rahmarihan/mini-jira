import { Card, CardContent, CardHeader } from '@/src/components/ui/card';
import { cn } from '@/lib/utils';

export type SkeletonVariant = 'card' | 'list' | 'table' | 'kanban';

interface SkeletonLoaderProps {
  variant?: SkeletonVariant;
  count?: number;
  className?: string;
}

function Shimmer({ className }: { className?: string }) {
  return <div className={cn('skeleton-shimmer rounded-md', className)} />;
}

function CardVariant({ count }: { count: number }) {
  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Shimmer className="h-4 w-24" />
              <Shimmer className="size-9 rounded-lg" />
            </CardHeader>
            <CardContent>
              <Shimmer className="h-8 w-16" />
              <Shimmer className="mt-2 h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <Shimmer className="h-5 w-40" />
          <Shimmer className="mt-2 h-3 w-56" />
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 rounded-lg border p-4">
              <Shimmer className="size-10 shrink-0 rounded-full" />
              <div className="flex-1 space-y-2">
                <Shimmer className="h-4 w-36" />
                <Shimmer className="h-3 w-20" />
              </div>
              <Shimmer className="h-6 w-12" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function ListVariant({ count }: { count: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 rounded-lg border bg-card p-4"
        >
          <Shimmer className="size-10 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Shimmer className="h-4 w-48" />
            <Shimmer className="h-3 w-32" />
          </div>
          <Shimmer className="h-8 w-20" />
        </div>
      ))}
    </div>
  );
}

function TableVariant({ count }: { count: number }) {
  return (
    <div className="overflow-hidden rounded-xl border">
      <div className="grid grid-cols-4 gap-4 border-b bg-muted/40 p-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Shimmer key={i} className="h-4 w-full max-w-24" />
        ))}
      </div>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="grid grid-cols-4 gap-4 border-b p-4 last:border-b-0"
        >
          {Array.from({ length: 4 }).map((_, j) => (
            <Shimmer key={j} className="h-4 w-full max-w-32" />
          ))}
        </div>
      ))}
    </div>
  );
}

function KanbanVariant() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, col) => (
        <div key={col} className="space-y-3 rounded-xl border bg-muted/20 p-3">
          <Shimmer className="h-5 w-28" />
          {Array.from({ length: 3 }).map((_, row) => (
            <div key={row} className="space-y-2 rounded-lg border bg-card p-3">
              <Shimmer className="h-4 w-3/4" />
              <Shimmer className="h-3 w-1/2" />
              <div className="flex gap-2 pt-1">
                <Shimmer className="h-5 w-14 rounded-full" />
                <Shimmer className="h-5 w-16 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

const DEFAULT_COUNT: Record<SkeletonVariant, number> = {
  card: 4,
  list: 6,
  table: 5,
  kanban: 4,
};

function SkeletonLoader({
  variant = 'card',
  count,
  className,
}: SkeletonLoaderProps) {
  const rows = count ?? DEFAULT_COUNT[variant];

  return (
    <div className={className} aria-busy="true" aria-label="Loading content">
      {variant === 'card' && <CardVariant count={rows} />}
      {variant === 'list' && <ListVariant count={rows} />}
      {variant === 'table' && <TableVariant count={rows} />}
      {variant === 'kanban' && <KanbanVariant />}
    </div>
  );
}

export default SkeletonLoader;
export { SkeletonLoader };
