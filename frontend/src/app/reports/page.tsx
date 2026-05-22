'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BarChart3 } from 'lucide-react';
import { useAuth } from '@/src/hooks/useAuth';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

/** Manager-only reports placeholder — M4 analytics integration */
export default function ReportsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const isManager = user?.role === 'Manager';

  useEffect(() => {
    if (user && !isManager) {
      router.replace('/kanban');
    }
  }, [user, isManager, router]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Team Reports</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Exportable metrics and sprint summaries
        </p>
      </div>

      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="size-5 text-muted-foreground" />
            Reports module
          </CardTitle>
          <CardDescription>
            M4 will connect reporting APIs and scheduled exports. Dashboard metrics are
            available on the Team Dashboard in the meantime.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Managers can view live stats on the Dashboard page.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
